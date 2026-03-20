"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { CASE_TAG_SUGGESTIONS } from "@/lib/constants";

export function CaseCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          tags: tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Unable to create case.");
      }

      const payload = (await response.json()) as { id: string };
      router.push(`/cases/${payload.id}`);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create case.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Case title</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-500/40 transition focus:ring-4"
          placeholder="Acute stroke review"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Description</span>
        <textarea
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-500/40 transition focus:ring-4"
          placeholder="Summarize context, expected findings, or workflow notes."
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Tags</span>
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-orange-500/40 transition focus:ring-4"
          placeholder="CT, urgent, research"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {CASE_TAG_SUGGESTIONS.map((tag) => (
          <button
            key={tag}
            type="button"
            className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
            onClick={() =>
              setTags((current) =>
                current.split(",").map((item) => item.trim()).includes(tag)
                  ? current
                  : [current, tag].filter(Boolean).join(", "),
              )
            }
          >
            {tag}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Creating case..." : "Create case"}
      </button>
    </form>
  );
}
