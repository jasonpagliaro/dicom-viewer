import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionCard } from "@/components/section-card";
import { buildOhifStudyUrl } from "@/lib/orthanc";
import { getStudyById } from "@/lib/data";
import { formatTimestamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudyDetailPage({
  params,
}: {
  params: Promise<{ studyId: string }>;
}) {
  const { studyId } = await params;
  const study = await getStudyById(studyId);

  if (!study) {
    notFound();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
      <SectionCard eyebrow="Study detail" title={study.displayTitle}>
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="section-title">Identity</p>
              <dl className="mt-4 grid gap-3 text-sm text-slate-700">
                <div>
                  <dt className="font-medium text-slate-500">Patient name</dt>
                  <dd>{study.patientName || "Unknown"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Patient ID</dt>
                  <dd>{study.patientId || "Unavailable"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Accession</dt>
                  <dd>{study.accessionNumber || "Unavailable"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">StudyInstanceUID</dt>
                  <dd className="font-mono text-xs text-slate-500">{study.studyInstanceUid}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="section-title">Overview</p>
              <dl className="mt-4 grid gap-3 text-sm text-slate-700">
                <div>
                  <dt className="font-medium text-slate-500">Modalities</dt>
                  <dd>{study.modalities.join("/") || "DICOM"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Series</dt>
                  <dd>{study.seriesCount}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Instances</dt>
                  <dd>{study.instanceCount}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Last synced</dt>
                  <dd>{formatTimestamp(study.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="section-title">Series list</p>
            <div className="mt-4 grid gap-3">
              {study.series.map((series) => (
                <div key={series.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {series.seriesDescription || `Series ${series.seriesNumber || "?"}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {series.modality || "DICOM"} | {series.instanceCount} instances
                      </p>
                    </div>
                    <div className="font-mono text-xs text-slate-400">
                      {series.seriesInstanceUid || "No SeriesInstanceUID"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/viewer?studyInstanceUID=${encodeURIComponent(study.studyInstanceUid)}`}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open viewer workspace
            </Link>
            <a
              href={buildOhifStudyUrl(study.studyInstanceUid)}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50"
              target="_blank"
              rel="noreferrer"
            >
              Open OHIF directly
            </a>
          </div>
        </div>
      </SectionCard>

      <SectionCard eyebrow="Linked cases" title="Case context">
        {study.cases.length === 0 ? (
          <p className="text-sm text-slate-500">This study is not attached to any case yet.</p>
        ) : (
          <div className="grid gap-3">
            {study.cases.map((item) => (
              <Link
                key={item.id}
                href={`/cases/${item.id}`}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-orange-200 hover:bg-orange-50"
              >
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">Open case detail</p>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
