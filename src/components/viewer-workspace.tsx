"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, PanelRightClose, PanelRightOpen } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

type ViewerWorkspaceProps = {
  backHref: string;
  backLabel: string;
  caseContext: {
    id: string;
    title: string;
    description: string | null;
    tags: string[];
    reports: Array<{
      id: string;
      title: string;
      status: string;
      revisionNumber: number;
      impression: string | null;
      findings: string | null;
    }>;
  } | null;
  directHref: string;
  study: {
    id: string;
    displayTitle: string;
    studyInstanceUid: string;
  };
};

function getSidebarClasses(panelPreference: boolean | null) {
  if (panelPreference === false) {
    return "hidden";
  }

  if (panelPreference === true) {
    return "block max-h-[46vh] overflow-y-auto border-t border-white/10 lg:h-full lg:w-[400px] lg:shrink-0 lg:border-l lg:border-t-0 xl:w-[440px]";
  }

  return "hidden lg:block lg:h-full lg:w-[400px] lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-white/10 xl:w-[440px]";
}

export function ViewerWorkspace({
  backHref,
  backLabel,
  caseContext,
  directHref,
  study,
}: ViewerWorkspaceProps) {
  const [panelPreference, setPanelPreference] = useState<boolean | null>(null);

  const toggleSidebar = () => {
    setPanelPreference((current) => {
      if (current === null) {
        return !window.matchMedia("(min-width: 1024px)").matches;
      }

      return !current;
    });
  };

  const ToggleIcon = panelPreference === false ? PanelRightOpen : PanelRightClose;

  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]">
      <header className="border-b border-white/10 bg-slate-950/78 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-orange-300/35 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>

          <div className="min-w-0 flex-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-orange-300/75">
              Viewer workspace
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
              {study.displayTitle}
            </h1>
            <p className="truncate text-xs text-slate-400">
              {caseContext
                ? `Case context: ${caseContext.title}`
                : "Standalone OHIF review workspace"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={directHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-orange-300/35 hover:bg-white/10"
            >
              Direct OHIF
              <ExternalLink className="h-4 w-4" />
            </a>
            {caseContext ? (
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-100 transition hover:border-orange-300/45 hover:bg-orange-500/18"
              >
                <ToggleIcon className="h-4 w-4" />
                Case panel
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-[56vh] flex-1 bg-black lg:min-h-0">
          <iframe
            src={directHref}
            className="h-full w-full border-0"
            title={`OHIF viewer for ${study.displayTitle}`}
          />
        </div>

        {caseContext ? (
          <aside
            className={clsx("bg-slate-950/92 backdrop-blur-xl", getSidebarClasses(panelPreference))}
          >
            <div className="grid gap-4 p-4 sm:p-5">
              <section className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.28)]">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-orange-300/80">
                  Case context
                </p>
                <h2 className="mt-3 text-xl font-semibold text-white">{caseContext.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {caseContext.description || "No description added for this case."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {caseContext.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-orange-300/28 bg-orange-500/12 px-3 py-1 text-xs font-semibold text-orange-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.24)]">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-orange-300/80">
                  Reports
                </p>
                <div className="mt-4 grid gap-3">
                  {caseContext.reports.length === 0 ? (
                    <p className="text-sm text-slate-400">No reports for this case yet.</p>
                  ) : (
                    caseContext.reports.map((report) => (
                      <article
                        key={report.id}
                        className="rounded-[1.35rem] border border-white/8 bg-slate-950/55 px-4 py-4"
                      >
                        <p className="font-semibold text-white">{report.title}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {report.status === "FINAL" ? "Final" : "Draft"} | Revision{" "}
                          {report.revisionNumber}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          {report.impression || report.findings || "No report text yet."}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <Link
                href={`/cases/${caseContext.id}`}
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-50"
              >
                Open full case workspace
              </Link>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
