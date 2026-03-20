import { Prisma, ReportStatus, UploadBatchStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { safeStudyTitle } from "@/lib/utils";

export type UploadFileDto = {
  id: string;
  tusId: string;
  originalName: string;
  relativePath: string | null;
  mimeType: string | null;
  sizeBytes: number;
  storagePath: string;
  status: string;
  warningMessage: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UploadBatchDto = {
  id: string;
  label: string | null;
  expectedFilesCount: number;
  completedFilesCount: number;
  processedFilesCount: number;
  warningCount: number;
  status: UploadBatchStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  files: UploadFileDto[];
};

export type StudySummaryDto = {
  id: string;
  orthancStudyId: string;
  studyInstanceUid: string;
  patientName: string | null;
  patientId: string | null;
  accessionNumber: string | null;
  studyDescription: string | null;
  displayTitle: string;
  modalities: string[];
  studyDate: string | null;
  seriesCount: number;
  instanceCount: number;
  updatedAt: string;
  caseCount: number;
};

export type StudyDetailDto = StudySummaryDto & {
  metadata: Prisma.JsonValue | null;
  studyTime: string | null;
  series: Array<{
    id: string;
    orthancSeriesId: string;
    seriesInstanceUid: string | null;
    modality: string | null;
    seriesDescription: string | null;
    seriesNumber: number | null;
    instanceCount: number;
  }>;
  cases: Array<{
    id: string;
    title: string;
  }>;
};

export type ShareTokenDto = {
  id: string;
  token: string;
  label: string | null;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
  lastAccessedAt: string | null;
};

export type ReportDto = {
  id: string;
  title: string;
  authorDisplayName: string | null;
  status: ReportStatus;
  clinicalInfo: string;
  technique: string;
  findings: string;
  impression: string;
  revisionNumber: number;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
};

export type CaseSummaryDto = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  studyCount: number;
  reportCount: number;
  activeShareCount: number;
};

export type CaseDetailDto = CaseSummaryDto & {
  studies: StudySummaryDto[];
  reports: ReportDto[];
  shareTokens: ShareTokenDto[];
};

function serializeUploadFile(file: {
  id: string;
  tusId: string;
  originalName: string;
  relativePath: string | null;
  mimeType: string | null;
  sizeBytes: bigint;
  storagePath: string;
  status: string;
  warningMessage: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): UploadFileDto {
  return {
    ...file,
    sizeBytes: Number(file.sizeBytes),
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
  };
}

function serializeStudy(study: {
  id: string;
  orthancStudyId: string;
  studyInstanceUid: string;
  patientName: string | null;
  patientId: string | null;
  accessionNumber: string | null;
  studyDescription: string | null;
  modalities: string[];
  studyDate: Date | null;
  seriesCount: number;
  instanceCount: number;
  updatedAt: Date;
  caseStudies?: Array<unknown>;
}): StudySummaryDto {
  return {
    id: study.id,
    orthancStudyId: study.orthancStudyId,
    studyInstanceUid: study.studyInstanceUid,
    patientName: study.patientName,
    patientId: study.patientId,
    accessionNumber: study.accessionNumber,
    studyDescription: study.studyDescription,
    displayTitle: safeStudyTitle(study.studyDescription, study.patientName),
    modalities: study.modalities,
    studyDate: study.studyDate?.toISOString() ?? null,
    seriesCount: study.seriesCount,
    instanceCount: study.instanceCount,
    updatedAt: study.updatedAt.toISOString(),
    caseCount: study.caseStudies?.length ?? 0,
  };
}

function serializeReport(report: {
  id: string;
  title: string;
  authorDisplayName: string | null;
  status: ReportStatus;
  clinicalInfo: string;
  technique: string;
  findings: string;
  impression: string;
  revisionNumber: number;
  createdAt: Date;
  updatedAt: Date;
  finalizedAt: Date | null;
}): ReportDto {
  return {
    ...report,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
    finalizedAt: report.finalizedAt?.toISOString() ?? null,
  };
}

function serializeShareToken(shareToken: {
  id: string;
  token: string;
  label: string | null;
  createdAt: Date;
  updatedAt: Date;
  revokedAt: Date | null;
  lastAccessedAt: Date | null;
}): ShareTokenDto {
  return {
    ...shareToken,
    createdAt: shareToken.createdAt.toISOString(),
    updatedAt: shareToken.updatedAt.toISOString(),
    revokedAt: shareToken.revokedAt?.toISOString() ?? null,
    lastAccessedAt: shareToken.lastAccessedAt?.toISOString() ?? null,
  };
}

export async function listRecentUploadBatches(limit = 8) {
  const batches = await prisma.uploadBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      files: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return batches.map<UploadBatchDto>((batch) => ({
    id: batch.id,
    label: batch.label,
    expectedFilesCount: batch.expectedFilesCount,
    completedFilesCount: batch.completedFilesCount,
    processedFilesCount: batch.processedFilesCount,
    warningCount: batch.warningCount,
    status: batch.status,
    errorMessage: batch.errorMessage,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    completedAt: batch.completedAt?.toISOString() ?? null,
    files: batch.files.map(serializeUploadFile),
  }));
}

export async function getUploadBatchById(id: string) {
  const batch = await prisma.uploadBatch.findUnique({
    where: { id },
    include: {
      files: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!batch) {
    return null;
  }

  return {
    id: batch.id,
    label: batch.label,
    expectedFilesCount: batch.expectedFilesCount,
    completedFilesCount: batch.completedFilesCount,
    processedFilesCount: batch.processedFilesCount,
    warningCount: batch.warningCount,
    status: batch.status,
    errorMessage: batch.errorMessage,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    completedAt: batch.completedAt?.toISOString() ?? null,
    files: batch.files.map(serializeUploadFile),
  } satisfies UploadBatchDto;
}

export async function listStudies(search?: string) {
  const trimmed = search?.trim();

  const studies = await prisma.study.findMany({
    where: trimmed
      ? {
          OR: [
            { patientName: { contains: trimmed, mode: "insensitive" } },
            { patientId: { contains: trimmed, mode: "insensitive" } },
            { accessionNumber: { contains: trimmed, mode: "insensitive" } },
            { studyDescription: { contains: trimmed, mode: "insensitive" } },
            { studyInstanceUid: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      caseStudies: true,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return studies.map(serializeStudy);
}

export async function getStudyById(id: string) {
  const study = await prisma.study.findUnique({
    where: { id },
    include: {
      series: {
        orderBy: [{ seriesNumber: "asc" }, { createdAt: "asc" }],
      },
      caseStudies: {
        include: {
          case: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!study) {
    return null;
  }

  return {
    ...serializeStudy(study),
    metadata: study.metadata,
    studyTime: study.studyTime,
    series: study.series.map((series) => ({
      id: series.id,
      orthancSeriesId: series.orthancSeriesId,
      seriesInstanceUid: series.seriesInstanceUid,
      modality: series.modality,
      seriesDescription: series.seriesDescription,
      seriesNumber: series.seriesNumber,
      instanceCount: series.instanceCount,
    })),
    cases: study.caseStudies.map((entry) => entry.case),
  } satisfies StudyDetailDto;
}

export async function findStudyByInstanceUid(studyInstanceUid: string) {
  const study = await prisma.study.findUnique({
    where: { studyInstanceUid },
    include: {
      caseStudies: true,
    },
  });

  return study ? serializeStudy(study) : null;
}

export async function listCases() {
  const cases = await prisma.case.findMany({
    include: {
      caseStudies: true,
      reports: true,
      shareTokens: {
        where: {
          revokedAt: null,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return cases.map<CaseSummaryDto>((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    tags: item.tags,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    studyCount: item.caseStudies.length,
    reportCount: item.reports.length,
    activeShareCount: item.shareTokens.length,
  }));
}

export async function getCaseById(id: string) {
  const item = await prisma.case.findUnique({
    where: { id },
    include: {
      caseStudies: {
        orderBy: [{ position: "asc" }, { attachedAt: "asc" }],
        include: {
          study: {
            include: {
              caseStudies: true,
            },
          },
        },
      },
      reports: {
        orderBy: { updatedAt: "desc" },
      },
      shareTokens: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    tags: item.tags,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    studyCount: item.caseStudies.length,
    reportCount: item.reports.length,
    activeShareCount: item.shareTokens.filter((share) => !share.revokedAt).length,
    studies: item.caseStudies.map((entry) => serializeStudy(entry.study)),
    reports: item.reports.map(serializeReport),
    shareTokens: item.shareTokens.map(serializeShareToken),
  } satisfies CaseDetailDto;
}

export async function listAvailableStudiesForCase(caseId: string) {
  const attached = await prisma.caseStudy.findMany({
    where: { caseId },
    select: { studyId: true },
  });

  const attachedIds = attached.map((item) => item.studyId);

  const studies = await prisma.study.findMany({
    where: attachedIds.length
      ? {
          id: {
            notIn: attachedIds,
          },
        }
      : undefined,
    include: {
      caseStudies: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return studies.map(serializeStudy);
}

export async function getCaseByShareToken(token: string) {
  const share = await prisma.shareToken.findFirst({
    where: {
      token,
      revokedAt: null,
    },
    include: {
      case: {
        include: {
          caseStudies: {
            orderBy: [{ position: "asc" }, { attachedAt: "asc" }],
            include: {
              study: {
                include: {
                  caseStudies: true,
                },
              },
            },
          },
          reports: {
            orderBy: { updatedAt: "desc" },
          },
          shareTokens: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!share) {
    return null;
  }

  await prisma.shareToken.update({
    where: { id: share.id },
    data: { lastAccessedAt: new Date() },
  });

  return {
    token: share.token,
    case: {
      id: share.case.id,
      title: share.case.title,
      description: share.case.description,
      tags: share.case.tags,
      createdAt: share.case.createdAt.toISOString(),
      updatedAt: share.case.updatedAt.toISOString(),
      studyCount: share.case.caseStudies.length,
      reportCount: share.case.reports.length,
      activeShareCount: share.case.shareTokens.filter((item) => !item.revokedAt).length,
      studies: share.case.caseStudies.map((entry) => serializeStudy(entry.study)),
      reports: share.case.reports.map(serializeReport),
      shareTokens: share.case.shareTokens.map(serializeShareToken),
    } satisfies CaseDetailDto,
  };
}
