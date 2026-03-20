"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { ShareTokenDto } from "@/lib/data";
import { formatRelative } from "@/lib/utils";

type ShareManagerProps = {
  caseId: string;
  shares: ShareTokenDto[];
};

export function ShareManager({ caseId, shares }: ShareManagerProps) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function createShare() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/shares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caseId,
          label,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to create share link.");
      }

      setLabel("");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create share link.");
    } finally {
      setPending(false);
    }
  }

  async function revokeShare(id: string) {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/shares/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to revoke share link.");
      }

      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to revoke share link.");
    } finally {
      setPending(false);
    }
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/shares/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    window.setTimeout(() => setCopiedToken(null), 1200);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Optional label for this share"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-500/40 transition focus:ring-4"
        />
        <button
          type="button"
          onClick={createShare}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? "Working..." : "Create link"}
        </button>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-3">
        {shares.length === 0 ? (
          <p className="text-sm text-slate-500">No share links exist for this case yet.</p>
        ) : (
          shares.map((share) => (
            <div
              key={share.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{share.label || "Untitled internal share"}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {share.revokedAt ? "Revoked" : "Active"} | Created {formatRelative(share.createdAt)} | Last opened{" "}
                  {formatRelative(share.lastAccessedAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!share.revokedAt ? (
                  <button
                    type="button"
                    onClick={() => copyLink(share.token)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    {copiedToken === share.token ? "Copied" : "Copy link"}
                  </button>
                ) : null}
                {!share.revokedAt ? (
                  <button
                    type="button"
                    onClick={() => revokeShare(share.id)}
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Revoke
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
