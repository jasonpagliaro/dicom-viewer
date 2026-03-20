"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import type { ReportDto } from "@/lib/data";
import { REPORT_SECTION_LABELS } from "@/lib/constants";
import { formatTimestamp } from "@/lib/utils";

type ReportEditorProps = {
  report: ReportDto;
  readonly?: boolean;
};

type ReportDraft = {
  title: string;
  authorDisplayName: string;
  clinicalInfo: string;
  technique: string;
  findings: string;
  impression: string;
};

export function ReportEditor({ report, readonly = false }: ReportEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<ReportDraft>({
    title: report.title,
    authorDisplayName: report.authorDisplayName ?? "",
    clinicalInfo: report.clinicalInfo,
    technique: report.technique,
    findings: report.findings,
    impression: report.impression,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(key: keyof ReportDraft) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft((current) => ({
        ...current,
        [key]: event.target.value,
      }));
    };
  }

  async function save(status = report.status) {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...draft,
          status,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to save report.");
      }

      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save report.");
    } finally {
      setPending(false);
    }
  }

  async function finalize(status: "FINAL" | "DRAFT") {
    await save(status);
  }

  return (
    <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-title">Report</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">{report.title}</h3>
          <p className="mt-2 text-sm text-slate-500">
            Revision {report.revisionNumber} | Updated {formatTimestamp(report.updatedAt)}
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
          {report.status === "FINAL" ? "Final report" : "Draft report"}
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Report title</span>
          <input
            value={draft.title}
            onChange={updateField("title")}
            disabled={readonly}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-500/40 transition focus:ring-4 disabled:bg-slate-100"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Author display name</span>
          <input
            value={draft.authorDisplayName}
            onChange={updateField("authorDisplayName")}
            disabled={readonly}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-500/40 transition focus:ring-4 disabled:bg-slate-100"
            placeholder="Dr. Sample Reader"
          />
        </label>
        {(Object.keys(REPORT_SECTION_LABELS) as Array<keyof typeof REPORT_SECTION_LABELS>).map((key) => (
          <label key={key} className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">{REPORT_SECTION_LABELS[key]}</span>
            <textarea
              rows={key === "findings" ? 6 : 4}
              value={draft[key]}
              onChange={updateField(key)}
              disabled={readonly}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-500/40 transition focus:ring-4 disabled:bg-slate-100"
            />
          </label>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {!readonly ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => save()}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {pending ? "Saving..." : "Save draft"}
            </button>
            {report.status === "FINAL" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => finalize("DRAFT")}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reopen draft
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => finalize("FINAL")}
                className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Finalize report
              </button>
            )}
          </>
        ) : null}
        <a
          href={`/api/reports/${report.id}/pdf`}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50"
          target="_blank"
          rel="noreferrer"
        >
          Download PDF
        </a>
      </div>
    </div>
  );
}
