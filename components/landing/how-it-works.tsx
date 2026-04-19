"use client";

import { ClipboardList, TrendingUp, FileDown } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";

const STEPS = [
  {
    n: "01",
    Icon: ClipboardList,
    title: "Answer 32 weighted questions",
    description:
      "Score your organisation across 8 dimensions on a simple 1-5 maturity scale. Most teams complete the assessment in under 10 minutes.",
  },
  {
    n: "02",
    Icon: TrendingUp,
    title: "Get benchmarked against your sector",
    description:
      "See how you compare to industry averages in retail, manufacturing, security, logistics and more. Identify your strongest pillar and priority gaps.",
  },
  {
    n: "03",
    Icon: FileDown,
    title: "Receive an actionable 12-month roadmap",
    description:
      "Auto-generated 3-phase plan (0–90 days · 3–6 months · 6–12 months) tailored to your scores and sector. Board-ready PDF in one click.",
  },
];

export function HowItWorks() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.12 });

  return (
    <section id="how-it-works" style={{ background: "var(--bg-subtle)" }} className="py-20 md:py-28">
      <div ref={sectionRef} className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto gsap-reveal">
          <p
            className="text-[11px] uppercase tracking-[0.25em]"
            style={{ fontWeight: 600, color: "var(--fg-3)" }}
          >
            How it works
          </p>
          <h2
            className="mt-3 text-3xl md:text-5xl tracking-tight leading-tight"
            style={{ fontWeight: 700, color: "var(--fg-1)" }}
          >
            From first click to board deck in{" "}
            <em style={{ color: "var(--amethyst-link)", fontStyle: "normal" }}>
              under 10 minutes.
            </em>
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative gsap-reveal">
              {i < STEPS.length - 1 && (
                <div
                  className="hidden md:block absolute top-8 left-[calc(100%-1rem)] w-8 h-px"
                  style={{ background: "var(--parchment-border)" }}
                />
              )}

              <div
                className="h-full bg-white glow-hover"
                style={{
                  borderRadius: "var(--r-lg)",
                  padding: "2rem",
                  border: "1px solid var(--parchment-border)",
                }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <span
                    className="text-4xl tracking-tighter"
                    style={{ fontWeight: 700, color: "var(--amethyst-link)" }}
                  >
                    {s.n}
                  </span>
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{
                      borderRadius: "var(--r-sm)",
                      background: "var(--mysteria-purple)",
                    }}
                  >
                    <s.Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
                  </div>
                </div>
                <h3
                  className="text-xl tracking-tight leading-tight"
                  style={{ fontWeight: 700, color: "var(--fg-1)" }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ fontWeight: 460, color: "var(--fg-2)" }}
                >
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
