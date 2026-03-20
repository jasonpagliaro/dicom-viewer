import express from "express";
import axios from "axios";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import unzipper from "unzipper";
import { UploadBatchStatus, UploadFileStatus } from "@prisma/client";

import { prisma } from "../lib/prisma";

const port = Number.parseInt(process.env.WORKER_PORT || "4000", 10);
const orthancUrl = (process.env.ORTHANC_INTERNAL_URL || "http://orthanc:8042").replace(
  /\/$/,
  "",
);
const uploadsDirectory = process.env.UPLOADS_DIRECTORY || "/uploads";
const processingBatches = new Set<string>();

type TusHookRequest = {
  Type: string;
  Event?: {
    Upload?: {
      ID: string;
      Size?: number;
      MetaData?: Record<string, string>;
      Storage?: {
        Path?: string;
      };
    };
  };
};

type OrthancInstanceResponse = {
  ParentStudy?: string;
};

type OrthancStudyResponse = {
  ID?: string;
  MainDicomTags?: Record<string, string>;
  Series?: string[];
};

type OrthancSeriesResponse = {
  MainDicomTags?: Record<string, string>;
  Instances?: string[];
};

function parseDicomDate(dateValue?: string) {
  if (!dateValue || dateValue.length !== 8) {
    return null;
  }

  const year = Number.parseInt(dateValue.slice(0, 4), 10);
  const month = Number.parseInt(dateValue.slice(4, 6), 10);
  const day = Number.parseInt(dateValue.slice(6, 8), 10);

  if ([year, month, day].some(Number.isNaN)) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function splitModalities(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split("\\")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function walkFiles(directory: string): Promise<string[]> {
  const entries = await fsp.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return walkFiles(fullPath);
      }
      return [fullPath];
    }),
  );

  return files.flat();
}

async function uploadDicomFile(filePath: string) {
  const stream = fs.createReadStream(filePath);
  try {
    const response = await axios.post<OrthancInstanceResponse>(
      `${orthancUrl}/instances`,
      stream,
      {
        headers: {
          "Content-Type": "application/dicom",
        },
        maxBodyLength: Number.POSITIVE_INFINITY,
        maxContentLength: Number.POSITIVE_INFINITY,
        timeout: 120_000,
      },
    );

    return response.data;
  } finally {
    stream.destroy();
  }
}

function isSkippableUploadError(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    !!error.response &&
    error.response.status >= 400 &&
    error.response.status < 500
  );
}

async function syncStudy(orthancStudyId: string) {
  const studyResponse = await axios.get<OrthancStudyResponse>(`${orthancUrl}/studies/${orthancStudyId}`, {
    timeout: 30_000,
  });
  const study = studyResponse.data;
  const mainTags = study.MainDicomTags ?? {};
  const seriesIds = study.Series ?? [];
  const modalities = splitModalities(mainTags.ModalitiesInStudy);
  const seriesRecords = await Promise.all(
    seriesIds.map(async (seriesId) => {
      const response = await axios.get<OrthancSeriesResponse>(`${orthancUrl}/series/${seriesId}`, {
        timeout: 30_000,
      });
      return {
        seriesId,
        payload: response.data,
      };
    }),
  );

  const instanceCount = seriesRecords.reduce(
    (total, entry) => total + (entry.payload.Instances?.length ?? 0),
    0,
  );

  const item = await prisma.study.upsert({
    where: { orthancStudyId },
    update: {
      studyInstanceUid: mainTags.StudyInstanceUID || orthancStudyId,
      patientName: mainTags.PatientName || null,
      patientId: mainTags.PatientID || null,
      accessionNumber: mainTags.AccessionNumber || null,
      studyDescription: mainTags.StudyDescription || null,
      modalities,
      studyDate: parseDicomDate(mainTags.StudyDate),
      studyTime: mainTags.StudyTime || null,
      seriesCount: seriesIds.length,
      instanceCount,
      metadata: study as unknown as object,
      lastSyncedAt: new Date(),
    },
    create: {
      orthancStudyId,
      studyInstanceUid: mainTags.StudyInstanceUID || orthancStudyId,
      patientName: mainTags.PatientName || null,
      patientId: mainTags.PatientID || null,
      accessionNumber: mainTags.AccessionNumber || null,
      studyDescription: mainTags.StudyDescription || null,
      modalities,
      studyDate: parseDicomDate(mainTags.StudyDate),
      studyTime: mainTags.StudyTime || null,
      seriesCount: seriesIds.length,
      instanceCount,
      metadata: study as unknown as object,
      lastSyncedAt: new Date(),
    },
    select: { id: true },
  });

  for (const entry of seriesRecords) {
    const seriesTags = entry.payload.MainDicomTags ?? {};
    await prisma.series.upsert({
      where: { orthancSeriesId: entry.seriesId },
      update: {
        studyId: item.id,
        seriesInstanceUid: seriesTags.SeriesInstanceUID || null,
        modality: seriesTags.Modality || null,
        seriesDescription: seriesTags.SeriesDescription || null,
        seriesNumber: seriesTags.SeriesNumber ? Number.parseInt(seriesTags.SeriesNumber, 10) : null,
        instanceCount: entry.payload.Instances?.length ?? 0,
        metadata: entry.payload as unknown as object,
      },
      create: {
        studyId: item.id,
        orthancSeriesId: entry.seriesId,
        seriesInstanceUid: seriesTags.SeriesInstanceUID || null,
        modality: seriesTags.Modality || null,
        seriesDescription: seriesTags.SeriesDescription || null,
        seriesNumber: seriesTags.SeriesNumber ? Number.parseInt(seriesTags.SeriesNumber, 10) : null,
        instanceCount: entry.payload.Instances?.length ?? 0,
        metadata: entry.payload as unknown as object,
      },
    });
  }

  await prisma.series.deleteMany({
    where: {
      studyId: item.id,
      orthancSeriesId: {
        notIn: seriesIds,
      },
    },
  });
}

async function processStoredFile(uploadFile: {
  id: string;
  originalName: string;
  storagePath: string;
}) {
  const isZip = uploadFile.originalName.toLowerCase().endsWith(".zip");
  const importedStudies = new Set<string>();
  let warningCount = 0;
  let warningMessage: string | null = null;
  let tempDirectory: string | null = null;

  try {
    let candidates = [uploadFile.storagePath];

    if (isZip) {
      tempDirectory = await fsp.mkdtemp(path.join(os.tmpdir(), "dicom-viewer-"));
      await fs
        .createReadStream(uploadFile.storagePath)
        .pipe(unzipper.Extract({ path: tempDirectory }))
        .promise();
      candidates = await walkFiles(tempDirectory);
    }

    for (const candidate of candidates) {
      try {
        const response = await uploadDicomFile(candidate);
        if (response.ParentStudy) {
          importedStudies.add(response.ParentStudy);
        }
      } catch (error) {
        if (isSkippableUploadError(error)) {
          warningCount += 1;
          continue;
        }
        throw error;
      }
    }

    if (warningCount > 0) {
      warningMessage = `${warningCount} file${warningCount === 1 ? "" : "s"} skipped during ingestion.`;
    }

    await prisma.uploadFile.update({
      where: { id: uploadFile.id },
      data: {
        status: importedStudies.size > 0 ? UploadFileStatus.PROCESSED : UploadFileStatus.SKIPPED,
        warningMessage,
        errorMessage: null,
      },
    });

    return {
      importedStudies,
      warningCount,
      processedCount: 1,
    };
  } catch (error) {
    await prisma.uploadFile.update({
      where: { id: uploadFile.id },
      data: {
        status: UploadFileStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Unknown ingestion error.",
      },
    });
    throw error;
  } finally {
    if (tempDirectory) {
      await fsp.rm(tempDirectory, { recursive: true, force: true });
    }
  }
}

async function processBatch(batchId: string) {
  if (processingBatches.has(batchId)) {
    return;
  }

  processingBatches.add(batchId);

  try {
    const batch = await prisma.uploadBatch.findUnique({
      where: { id: batchId },
      include: {
        files: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!batch || batch.status === UploadBatchStatus.COMPLETED) {
      return;
    }

    await prisma.uploadBatch.update({
      where: { id: batchId },
      data: {
        status: UploadBatchStatus.PROCESSING,
        errorMessage: null,
      },
    });

    const importedStudies = new Set<string>();
    let warningCount = 0;
    let processedFilesCount = 0;

    for (const file of batch.files) {
      const result = await processStoredFile({
        id: file.id,
        originalName: file.originalName,
        storagePath: file.storagePath,
      });

      warningCount += result.warningCount;
      processedFilesCount += result.processedCount;
      for (const studyId of result.importedStudies) {
        importedStudies.add(studyId);
      }
    }

    if (importedStudies.size === 0) {
      await prisma.uploadBatch.update({
        where: { id: batchId },
        data: {
          status: UploadBatchStatus.FAILED,
          processedFilesCount,
          warningCount,
          errorMessage: "No valid DICOM instances were imported from this batch.",
        },
      });
      return;
    }

    for (const orthancStudyId of importedStudies) {
      await syncStudy(orthancStudyId);
    }

    await prisma.uploadBatch.update({
      where: { id: batchId },
      data: {
        status: UploadBatchStatus.COMPLETED,
        processedFilesCount,
        warningCount,
        errorMessage: null,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.uploadBatch.update({
      where: { id: batchId },
      data: {
        status: UploadBatchStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Batch processing failed.",
      },
    });
  } finally {
    processingBatches.delete(batchId);
  }
}

async function scanPendingBatches() {
  const batches = await prisma.uploadBatch.findMany({
    where: {
      status: {
        in: [UploadBatchStatus.READY, UploadBatchStatus.PROCESSING],
      },
    },
    select: {
      id: true,
    },
  });

  for (const batch of batches) {
    void processBatch(batch.id);
  }
}

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/hooks/tusd", async (request, response) => {
  const hook = request.body as TusHookRequest;
  const upload = hook.Event?.Upload;

  if (hook.Type !== "post-finish" || !upload) {
    response.json({});
    return;
  }

  const metadata = upload.MetaData ?? {};
  const batchId = metadata.uploadBatchId;

  if (!batchId) {
    response.json({});
    return;
  }

  const storagePath =
    upload.Storage?.Path || path.join(uploadsDirectory, upload.ID);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.uploadFile.findUnique({
        where: { tusId: upload.ID },
        select: { id: true },
      });

      if (!existing) {
        await tx.uploadFile.create({
          data: {
            batchId,
            tusId: upload.ID,
            originalName: metadata.originalName || metadata.filename || upload.ID,
            relativePath: metadata.relativePath || null,
            mimeType: metadata.mimeType || null,
            sizeBytes: BigInt(upload.Size || 0),
            storagePath,
          },
        });

        await tx.uploadBatch.update({
          where: { id: batchId },
          data: {
            completedFilesCount: {
              increment: 1,
            },
          },
        });
      }

      return tx.uploadBatch.findUnique({
        where: { id: batchId },
        select: {
          id: true,
          expectedFilesCount: true,
          completedFilesCount: true,
        },
      });
    });

    if (
      result &&
      result.completedFilesCount >= result.expectedFilesCount &&
      result.expectedFilesCount > 0
    ) {
      await prisma.uploadBatch.update({
        where: { id: batchId },
        data: {
          status: UploadBatchStatus.READY,
        },
      });
      void processBatch(batchId);
    }

    response.json({});
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Unable to register upload.",
    });
  }
});

app.listen(port, () => {
  console.log(`worker listening on ${port}`);
  void scanPendingBatches();
  setInterval(() => {
    void scanPendingBatches();
  }, 10_000);
});
