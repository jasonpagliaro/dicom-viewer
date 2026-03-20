import { SectionCard } from "@/components/section-card";
import { UploadDashboard } from "@/components/upload-dashboard";
import { listRecentUploadBatches } from "@/lib/data";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const recentBatches = await listRecentUploadBatches(6);

  return (
    <div className="grid gap-6">
      <SectionCard eyebrow="Ingestion" title="Bring studies into the archive">
        <UploadDashboard />
      </SectionCard>

      <SectionCard eyebrow="History" title="Recent upload batches">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentBatches.length === 0 ? (
            <p className="text-sm text-slate-500">No upload batches have been created yet.</p>
          ) : (
            recentBatches.map((batch) => (
              <article
                key={batch.id}
                className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <p className="section-title">{batch.status}</p>
                <h3 className="mt-3 text-lg font-semibold text-slate-950">
                  {batch.label || "Unnamed batch"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {batch.completedFilesCount}/{batch.expectedFilesCount} files uploaded |{" "}
                  {batch.processedFilesCount} processed | {batch.warningCount} warnings
                </p>
                <p className="mt-4 text-sm text-slate-500">
                  Updated {formatRelative(batch.updatedAt)}
                </p>
              </article>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
