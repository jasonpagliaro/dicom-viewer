"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateReportButtonProps = {
  caseId: string;
};

export function CreateReportButton({ caseId }: CreateReportButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/cases/${caseId}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to create report.");
      }

      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create report.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleCreate}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create report"}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
