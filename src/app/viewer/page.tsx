import Link from "next/link";

import { ViewerWorkspace } from "@/components/viewer-workspace";
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
      <div className="flex min-h-dvh items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/74 p-8 shadow-[0_30px_100px_rgba(2,6,23,0.52)] backdrop-blur-xl">
          <p className="text-[0.72rem] uppercase tracking-[0.3em] text-orange-300/80">Viewer</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Choose a study</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Open this page with a `studyInstanceUID` query parameter from the study browser or a
            case.
          </p>
          <Link
            href="/studies"
            className="mt-6 inline-flex rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-50"
          >
            Browse studies
          </Link>
        </div>
      </div>
    );
  }

  const directHref = buildOhifStudyUrl(study.studyInstanceUid);

  return (
    <ViewerWorkspace
      backHref={item ? `/cases/${item.id}` : `/studies/${study.id}`}
      backLabel={item ? "Back to case" : "Back to study"}
      caseContext={
        item
          ? {
              id: item.id,
              title: item.title,
              description: item.description,
              tags: item.tags,
              reports: item.reports.map((report) => ({
                id: report.id,
                title: report.title,
                status: report.status,
                revisionNumber: report.revisionNumber,
                impression: report.impression,
                findings: report.findings,
              })),
            }
          : null
      }
      directHref={directHref}
      study={{
        id: study.id,
        displayTitle: study.displayTitle,
        studyInstanceUid: study.studyInstanceUid,
      }}
    />
  );
}
