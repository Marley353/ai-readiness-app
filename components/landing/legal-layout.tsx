import Link from "next/link";
import type { ReactNode } from "react";

// Shared layout for legal pages — light content area with the same dark
// top-nav strip used on the marketing landing page, but slimmed down
// (no sign-in pills) since these pages don't need conversion CTAs.
export function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div style={{ background: "#fafafa" }} className="min-h-screen">
      <nav
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ background: "rgba(10,10,10,0.7)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="mx-auto max-w-3xl px-6 md:px-10 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white">
            <span
              className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black"
              style={{ background: "#c4661a" }}
            >
              AI
            </span>
            AI Readiness
          </Link>
          <Link href="/" className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition">
            ← Back to home
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 md:px-10 py-12 md:py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Legal</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="mt-2 text-xs text-slate-500">Last updated: {lastUpdated}</p>

        <article
          className="mt-10 rounded-2xl bg-white p-6 md:p-10 prose-slate"
          style={{ border: "1px solid #e5e7eb" }}
        >
          {children}
        </article>

        <div className="mt-10 text-center text-xs text-slate-500">
          Questions about this document?{" "}
          <a href="mailto:support@aireadiness.app" className="font-semibold text-slate-900 hover:text-indigo-600 transition">
            Email us
          </a>
          .
        </div>
      </main>
    </div>
  );
}
