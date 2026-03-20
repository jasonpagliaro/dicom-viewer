import type { ReactNode } from "react";

export default function ViewerLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-slate-950 text-white">{children}</div>;
}
