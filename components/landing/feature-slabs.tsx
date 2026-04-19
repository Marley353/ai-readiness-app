"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, BarChart3, FileText } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";

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
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.12 });

  return (
    <section className="bg-white py-20 md:py-28">
      <div ref={sectionRef} className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-20 gsap-reveal">
          <p
            className="text-[11px] uppercase tracking-[0.25em]"
            style={{ fontWeight: 600, color: "var(--fg-3)" }}
          >
            Why Pro
          </p>
          <h2
            className="mt-3 text-3xl md:text-5xl tracking-tight leading-tight"
            style={{ fontWeight: 700, color: "var(--fg-1)" }}
          >
            Built for leaders who need{" "}
            <em style={{ color: "var(--amethyst-link)", fontStyle: "normal" }}>
              answers, not slides.
            </em>
          </h2>
        </div>

        <div className="space-y-20 md:space-y-28">
          {SLABS.map((slab, i) => (
            <div
              key={slab.eyebrow}
              className={`gsap-reveal grid gap-10 md:gap-16 md:grid-cols-2 md:items-center ${
                i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
              }`}
            >
              {/* Copy column */}
              <div>
                <p
                  className="text-[11px] uppercase tracking-[0.25em]"
                  style={{ fontWeight: 600, color: "var(--fg-3)" }}
                >
                  {slab.eyebrow}
                </p>
                <h3
                  className="mt-3 text-2xl md:text-4xl tracking-tight leading-tight"
                  style={{ fontWeight: 700, color: "var(--fg-1)" }}
                >
                  {slab.title}
                </h3>
                <p
                  className="mt-4 text-base leading-relaxed"
                  style={{ fontWeight: 460, color: "var(--fg-2)" }}
                >
                  {slab.description}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {slab.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ fontWeight: 460, color: "var(--fg-2)" }}
                    >
                      <span
                        className="flex-shrink-0 w-4 h-4 flex items-center justify-center mt-0.5"
                        style={{
                          borderRadius: "var(--r-sm)",
                          background: "var(--mysteria-purple)",
                        }}
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
                  className="group mt-7 inline-flex items-center gap-1.5 text-sm transition"
                  style={{
                    fontWeight: 600,
                    color: "var(--amethyst-link)",
                  }}
                >
                  {slab.ctaLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Visual column — stylised preview using icon + gradient backdrop */}
              <div>
                <div
                  className="relative overflow-hidden flex items-center justify-center"
                  style={{
                    borderRadius: "var(--r-lg)",
                    aspectRatio: "4/3",
                    background:
                      "linear-gradient(160deg, var(--mysteria-purple-3), var(--mysteria-purple-2) 50%, var(--mysteria-purple))",
                    border: "1px solid var(--white-20)",
                  }}
                >
                  {/* Diffused aurora blob */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-30 blur-[100px] pointer-events-none"
                    style={{ background: "radial-gradient(circle, var(--lavender-glow), transparent 60%)" }}
                  />
                  <div
                    className="relative w-28 h-28 flex items-center justify-center shadow-2xl"
                    style={{
                      borderRadius: "var(--r-lg)",
                      background: "linear-gradient(135deg, var(--mysteria-purple-3), var(--amethyst-link))",
                      boxShadow: "var(--shadow-glow)",
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
