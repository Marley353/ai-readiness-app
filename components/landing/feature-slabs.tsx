import Link from "next/link";
import { ArrowRight, TrendingUp, BarChart3, FileText } from "lucide-react";

const SLABS = [
  {
    eyebrow: "Industry benchmarks",
    Icon: BarChart3,
    title: "Know exactly where you stand in your sector.",
    description:
      "Every pillar score is benchmarked against the average in your industry — retail, manufacturing, logistics, security, corporate and more. No guessing whether your 65% is above or below peers.",
    bullets: [
      "Sector-specific benchmark on every pillar progress bar",
      "Second series on the bar + radar charts",
      "Clear ↑ Above / ↓ Below indicator with delta",
    ],
    ctaLabel: "See the benchmarks",
    ctaHref: "/app",
  },
  {
    eyebrow: "12-month roadmap",
    Icon: TrendingUp,
    title: "A phased plan, auto-generated from your scores.",
    description:
      "Three clear phases — Foundation (0-90 days), Build (3-6 months), Scale (6-12 months) — each with specific actions mapped to your weakest pillars and sector best practices.",
    bullets: [
      "Phase-by-phase action items with priority tags",
      "Tailored to your lowest-scoring dimensions first",
      "Timeline format ready to drop into a board pack",
    ],
    ctaLabel: "Preview the roadmap",
    ctaHref: "/pricing",
  },
  {
    eyebrow: "Boardroom exports",
    Icon: FileText,
    title: "Board-ready PDF in one click.",
    description:
      "Professional 4-page report with your organisation name, sector profile, scorecard, benchmark comparisons, top opportunities and risks, and strategic recommendations. Designed for executive committee circulation.",
    bullets: [
      "Confidential cover page with your logo area",
      "Executive summary, pillar scores and ROI scenarios",
      "Auto-paginated — no manual formatting needed",
    ],
    ctaLabel: "Try the export",
    ctaHref: "/app",
  },
];

export function FeatureSlabs() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Why Pro</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Built for leaders who need{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0066ff, #a855f7 50%, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              answers, not slides.
            </span>
          </h2>
        </div>

        <div className="space-y-20 md:space-y-28">
          {SLABS.map((slab, i) => (
            <div
              key={slab.eyebrow}
              className={`grid gap-10 md:gap-16 md:grid-cols-2 md:items-center ${
                i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
              }`}
            >
              {/* Copy column */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">{slab.eyebrow}</p>
                <h3 className="mt-3 text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {slab.title}
                </h3>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">{slab.description}</p>
                <ul className="mt-6 space-y-2.5">
                  {slab.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span
                        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                        style={{ background: "#0a0a0a" }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href={slab.ctaHref}
                  className="group mt-7 inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 hover:text-indigo-600 transition"
                >
                  {slab.ctaLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Visual column — stylised preview using icon + gradient backdrop */}
              <div>
                <div
                  className="relative rounded-3xl aspect-[4/3] overflow-hidden flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(140deg, rgba(0,102,255,0.08), rgba(168,85,247,0.05) 60%, rgba(236,72,153,0.08)), #0a0a0a",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {/* Diffused aurora blob */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-30 blur-[100px] pointer-events-none"
                    style={{ background: "radial-gradient(circle, #0066ff, transparent 60%)" }}
                  />
                  <div
                    className="relative w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl"
                    style={{
                      background: "linear-gradient(135deg, #0066ff, #ec4899)",
                      boxShadow: "0 20px 60px rgba(0,102,255,0.4)",
                    }}
                  >
                    <slab.Icon className="h-12 w-12 text-white" strokeWidth={1.8} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
