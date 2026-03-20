import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { buildOhifStudyUrl } from "@/lib/orthanc";
import { findStudyByInstanceUid, getCaseById } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ViewerPage({
  searchParams,
}: {
  searchParams: Promise<{ studyInstanceUID?: string; caseId?: string }>;
}) {
  const { studyInstanceUID, caseId } = await searchParams;
  const [study, item] = await Promise.all([
    studyInstanceUID ? findStudyByInstanceUid(studyInstanceUID) : Promise.resolve(null),
    caseId ? getCaseById(caseId) : Promise.resolve(null),
  ]);

  if (!studyInstanceUID || !study) {
    return (
      <SectionCard eyebrow="Viewer" title="Choose a study">
        <p className="text-sm text-slate-600">
          Open this page with a `studyInstanceUID` query parameter from the study browser or a case.
        </p>
        <Link
          href="/studies"
          className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Browse studies
        </Link>
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.78fr)]">
      <SectionCard eyebrow="Viewer" title={study.displayTitle}>
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950">
          <iframe
            src={buildOhifStudyUrl(study.studyInstanceUid)}
            className="h-[72vh] w-full"
            title={`OHIF viewer for ${study.displayTitle}`}
          />
        </div>
      </SectionCard>

      <SectionCard eyebrow="Sidebar" title="Case context">
        {item ? (
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {item.description || "No description added for this case."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="section-title">Reports</p>
              <div className="mt-4 grid gap-3">
                {item.reports.length === 0 ? (
                  <p className="text-sm text-slate-500">No reports for this case yet.</p>
                ) : (
                  item.reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <p className="font-semibold text-slate-900">{report.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {report.status === "FINAL" ? "Final" : "Draft"} | Revision {report.revisionNumber}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {report.impression || report.findings || "No report text yet."}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <Link
              href={`/cases/${item.id}`}
              className="inline-flex rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open full case workspace
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-sm text-slate-600">
              This view is running without a case sidebar. Open the viewer from a case to include reports and share context alongside OHIF.
            </p>
            <Link
              href={`/studies/${study.id}`}
              className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50"
            >
              Open study detail
            </Link>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
