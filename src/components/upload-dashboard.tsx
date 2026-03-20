"use client";

import { useEffect, useState } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import Tus from "@uppy/tus";

import type { UploadBatchDto } from "@/lib/data";
import { formatFileSize, formatTimestamp } from "@/lib/utils";

const tusEndpoint =
  process.env.NEXT_PUBLIC_TUS_ENDPOINT?.replace(/\/$/, "") || "/files";

export function UploadDashboard() {
  const [label, setLabel] = useState("");
  const [batch, setBatch] = useState<UploadBatchDto | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [uppy] = useState(
    () =>
      new Uppy({
        autoProceed: false,
        allowMultipleUploadBatches: false,
      }).use(Tus, {
        endpoint: `${tusEndpoint}/`,
        chunkSize: 8 * 1024 * 1024,
        allowedMetaFields: [
          "uploadBatchId",
          "originalName",
          "relativePath",
          "mimeType",
        ],
      }),
  );

  useEffect(() => {
    return () => {
      uppy.destroy();
    };
  }, [uppy]);

  useEffect(() => {
    if (!batchId || !polling) {
      return;
    }

    const loadBatch = async () => {
      const response = await fetch(`/api/uploads/${batchId}`);
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as UploadBatchDto;
      setBatch(payload);
      if (payload.status === "COMPLETED" || payload.status === "FAILED") {
        setPolling(false);
      }
    };

    void loadBatch();
    const handle = window.setInterval(() => {
      void loadBatch();
    }, 4000);

    return () => {
      window.clearInterval(handle);
    };
  }, [batchId, polling]);

  async function handleUpload() {
    const files = uppy.getFiles();
    if (files.length === 0) {
      setError("Choose one or more files, folders, or ZIP archives first.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/upload-batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label,
          expectedFilesCount: files.length,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to create upload batch.");
      }

      const payload = (await response.json()) as { id: string };
      setBatchId(payload.id);
      setPolling(true);

      for (const file of files) {
        const browserFile = file.data as File & { webkitRelativePath?: string };
        uppy.setFileMeta(file.id, {
          uploadBatchId: payload.id,
          originalName: file.name,
          relativePath: browserFile.webkitRelativePath || file.name,
          mimeType: file.type || "application/octet-stream",
        });
      }

      const result = await uppy.upload();
      if (result?.failed?.length) {
        throw new Error("One or more uploads failed before ingestion finished.");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to upload files.",
      );
      setPolling(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
      <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-2">
            <span className="text-sm font-medium text-slate-700">Batch label</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Emergency CT import, MR teaching set, etc."
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-500/40 transition focus:ring-4"
            />
          </label>
          <button
            type="button"
            onClick={handleUpload}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {pending ? "Uploading..." : "Begin upload"}
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Select individual DICOM files, a directory tree, or ZIP archives. Uploads resume through tus, then the worker imports valid instances into Orthanc.
        </p>
        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
          <Dashboard
            uppy={uppy}
            proudlyDisplayPoweredByUppy={false}
            width="100%"
            height={430}
            note="Drag folders, whole studies, or ZIP archives here."
            showLinkToFileUploadResult={false}
            showProgressDetails
          />
        </div>
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm">
        <p className="section-title">Current batch</p>
        {batch ? (
          <div className="mt-4 grid gap-4">
            <div className="rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-orange-200">Status</p>
              <p className="mt-2 text-2xl font-semibold">{batch.status}</p>
              <p className="mt-2 text-sm text-slate-300">
                {batch.completedFilesCount}/{batch.expectedFilesCount} uploads finished |{" "}
                {batch.processedFilesCount} processed | {batch.warningCount} warnings
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-700">Created</p>
              <p className="mt-1 text-sm text-slate-500">{formatTimestamp(batch.createdAt)}</p>
              {batch.errorMessage ? (
                <p className="mt-3 text-sm text-rose-600">{batch.errorMessage}</p>
              ) : null}
            </div>
            <div className="grid gap-3">
              {batch.files.map((file) => (
                <div
                  key={file.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{file.originalName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {file.relativePath || "No relative path"} | {formatFileSize(file.sizeBytes)}
                      </p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {file.status}
                    </div>
                  </div>
                  {file.warningMessage ? (
                    <p className="mt-3 text-sm text-amber-700">{file.warningMessage}</p>
                  ) : null}
                  {file.errorMessage ? (
                    <p className="mt-3 text-sm text-rose-600">{file.errorMessage}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Start an upload to watch batch processing, ZIP expansion, DICOM ingestion, and any warnings from invalid files.
          </p>
        )}
      </div>
    </div>
  );
}
