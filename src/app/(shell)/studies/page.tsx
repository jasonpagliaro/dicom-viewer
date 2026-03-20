import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { listStudies } from "@/lib/data";
import { formatTimestamp } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const studies = await listStudies(q);

  return (
    <div className="grid gap-6">
      <SectionCard eyebrow="Library" title="Study browser">
        <form className="grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by patient, study description, accession, or StudyInstanceUID"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-500/40 transition focus:ring-4"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {studies.length === 0 ? (
            <p className="text-sm text-slate-500">
              No studies match the current search. Upload DICOM files or ZIP archives to start populating the library.
            </p>
          ) : (
            studies.map((study) => (
              <article
                key={study.id}
                className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="section-title">{study.modalities.join("/") || "DICOM"}</p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950">{study.displayTitle}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Patient {study.patientName || "Unknown"} | ID {study.patientId || "Unavailable"}
                    </p>
                    <p className="mt-2 font-mono text-xs text-slate-400">{study.studyInstanceUid}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    <p>{study.seriesCount} series</p>
                    <p>{study.instanceCount} instances</p>
                    <p>{study.caseCount} cases</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/studies/${study.id}`}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Study detail
                  </Link>
                  <Link
                    href={`/viewer?studyInstanceUID=${encodeURIComponent(study.studyInstanceUid)}`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    Open viewer workspace
                  </Link>
                </div>
                <p className="mt-4 text-sm text-slate-500">Last synced {formatTimestamp(study.updatedAt)}</p>
              </article>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
