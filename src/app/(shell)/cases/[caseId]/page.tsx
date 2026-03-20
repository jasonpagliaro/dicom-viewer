import Link from "next/link";
import { notFound } from "next/navigation";

import { AttachStudyForm } from "@/components/attach-study-form";
import { CreateReportButton } from "@/components/create-report-button";
import { ReportEditor } from "@/components/report-editor";
import { SectionCard } from "@/components/section-card";
import { ShareManager } from "@/components/share-manager";
import { getCaseById, listAvailableStudiesForCase } from "@/lib/data";
import { formatTimestamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const [item, availableStudies] = await Promise.all([
    getCaseById(caseId),
    listAvailableStudiesForCase(caseId),
  ]);

  if (!item) {
    notFound();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.82fr)]">
      <div className="grid gap-6">
        <SectionCard eyebrow="Case detail" title={item.title}>
          <div className="grid gap-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm leading-7 text-slate-600">
                {item.description || "No case description has been added yet."}
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
              <p className="mt-4 text-sm text-slate-500">Updated {formatTimestamp(item.updatedAt)}</p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-title">Studies</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">
                    Attached imaging studies
                  </h3>
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {item.studies.length} linked
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {item.studies.length === 0 ? (
                  <p className="text-sm text-slate-500">Attach a study to start reviewing this case.</p>
                ) : (
                  item.studies.map((study) => (
                    <div
                      key={study.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{study.displayTitle}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {study.modalities.join("/") || "DICOM"} | {study.seriesCount} series |{" "}
                            {study.instanceCount} instances
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/studies/${study.id}`}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50"
                          >
                            Study detail
                          </Link>
                          <Link
                            href={`/viewer?studyInstanceUID=${encodeURIComponent(
                              study.studyInstanceUid,
                            )}&caseId=${item.id}`}
                            className="rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Open viewer workspace
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Reports" title="Templated free-text reporting">
          <div className="grid gap-4">
            <CreateReportButton caseId={item.id} />
            {item.reports.length === 0 ? (
              <p className="text-sm text-slate-500">Create the first report for this case to start capturing findings.</p>
            ) : (
              item.reports.map((report) => <ReportEditor key={report.id} report={report} />)
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6">
        <SectionCard eyebrow="Attach" title="Add existing studies">
          <AttachStudyForm caseId={item.id} studies={availableStudies} />
        </SectionCard>

        <SectionCard eyebrow="Shares" title="Internal review links">
          <ShareManager caseId={item.id} shares={item.shareTokens} />
        </SectionCard>
      </div>
    </div>
  );
}
