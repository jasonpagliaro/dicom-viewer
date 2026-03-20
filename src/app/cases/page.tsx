import Link from "next/link";

import { CaseCreateForm } from "@/components/case-create-form";
import { SectionCard } from "@/components/section-card";
import { listCases } from "@/lib/data";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const cases = await listCases();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <SectionCard eyebrow="Cases" title="Shared review workspaces">
        <div className="grid gap-4">
          {cases.length === 0 ? (
            <p className="text-sm text-slate-500">No cases exist yet. Create one to group studies, reports, and share links.</p>
          ) : (
            cases.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="section-title">Case</p>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950">{item.title}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {item.description || "No case description provided yet."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    <p>{item.studyCount} studies</p>
                    <p>{item.reportCount} reports</p>
                    <p>{item.activeShareCount} links</p>
                  </div>
                </div>
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
                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">Updated {formatRelative(item.updatedAt)}</p>
                  <Link
                    href={`/cases/${item.id}`}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open case
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard eyebrow="Create" title="New case">
        <CaseCreateForm />
      </SectionCard>
    </div>
  );
}
