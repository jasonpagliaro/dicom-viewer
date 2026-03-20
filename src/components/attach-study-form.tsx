"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { StudySummaryDto } from "@/lib/data";

type AttachStudyFormProps = {
  caseId: string;
  studies: StudySummaryDto[];
};

export function AttachStudyForm({ caseId, studies }: AttachStudyFormProps) {
  const router = useRouter();
  const [studyId, setStudyId] = useState(studies[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleAttach() {
    if (!studyId) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/cases/${caseId}/studies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studyId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to attach study.");
      }

      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to attach study.");
    } finally {
      setPending(false);
    }
  }

  if (studies.length === 0) {
    return <p className="text-sm text-slate-500">All current studies are already attached to this case.</p>;
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Attach an existing study</span>
        <select
          value={studyId}
          onChange={(event) => setStudyId(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-500/40 transition focus:ring-4"
        >
          {studies.map((study) => (
            <option key={study.id} value={study.id}>
              {study.displayTitle} ({study.modalities.join("/") || "DICOM"})
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="button"
        onClick={handleAttach}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Attaching..." : "Attach study"}
      </button>
    </div>
  );
}
