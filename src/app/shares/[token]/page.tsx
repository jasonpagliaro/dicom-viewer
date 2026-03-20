import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportEditor } from "@/components/report-editor";
import { SectionCard } from "@/components/section-card";
import { getCaseByShareToken } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const shared = await getCaseByShareToken(token);

  if (!shared) {
    notFound();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.82fr)]">
      <SectionCard eyebrow="Shared case" title={shared.case.title}>
        <p className="text-sm leading-7 text-slate-600">
          {shared.case.description || "No description was added to this case."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {shared.case.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          {shared.case.studies.map((study) => (
            <div key={study.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <p className="font-semibold text-slate-900">{study.displayTitle}</p>
              <p className="mt-1 text-sm text-slate-500">
                {study.modalities.join("/") || "DICOM"} | {study.seriesCount} series
              </p>
              <Link
                href={`/viewer?studyInstanceUID=${encodeURIComponent(study.studyInstanceUid)}&caseId=${shared.case.id}`}
                className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open viewer
              </Link>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard eyebrow="Reports" title="Read-only reports">
        <div className="grid gap-4">
          {shared.case.reports.length === 0 ? (
            <p className="text-sm text-slate-500">No reports have been authored for this case yet.</p>
          ) : (
            shared.case.reports.map((report) => (
              <ReportEditor key={report.id} report={report} readonly />
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
