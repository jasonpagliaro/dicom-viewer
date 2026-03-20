import type { ReactNode } from "react";

import { Activity, FolderUp, FolderSearch2, Share2 } from "lucide-react";

import { NavLink } from "@/components/nav-link";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.2),_transparent_32%),linear-gradient(180deg,_#0f172a_0%,_#111827_48%,_#f8fafc_48%,_#f8fafc_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,transparent_45%,rgba(255,255,255,0.03)_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/70 px-5 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-200 ring-1 ring-orange-300/20">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-orange-200/80">
                  Dockerized DICOM Viewer
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Upload, review, organize, and share imaging studies from one stack.
                </h1>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-200 sm:flex">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-orange-200">
                  <FolderUp className="h-4 w-4" />
                  Upload-first ingestion
                </div>
                <p className="mt-1 text-slate-300">Resumable tus uploads for large folders and ZIP archives.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-orange-200">
                  <FolderSearch2 className="h-4 w-4" />
                  OHIF + Orthanc
                </div>
                <p className="mt-1 text-slate-300">Same-origin viewing with DICOMweb-backed studies and MPR support.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-orange-200">
                  <Share2 className="h-4 w-4" />
                  Case sharing
                </div>
                <p className="mt-1 text-slate-300">Templated reports, revisions, and revocable internal share links.</p>
              </div>
            </div>
          </div>
          <nav className="mt-5 flex flex-wrap gap-2">
            <NavLink href="/upload" label="Upload" />
            <NavLink href="/studies" label="Studies" />
            <NavLink href="/cases" label="Cases" />
            <NavLink href="/viewer" label="Viewer" />
          </nav>
        </header>
        <main className="mt-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
