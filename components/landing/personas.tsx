"use client";

import { Briefcase, LayoutGrid, Building2 } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";

const PERSONAS = [
  {
    Icon: Briefcase,
    title: "Consultants",
    headline: "Deliver faster, defensible readiness reports.",
    description:
      "Ship boardroom-ready assessments to clients in hours, not weeks. The 8-dimension framework gives you a consistent, credible baseline across every engagement.",
  },
  {
    Icon: LayoutGrid,
    title: "Transformation leaders",
    headline: "See the full map before you commit investment.",
    description:
      "Stop making AI roadmap decisions in the dark. Benchmark against your sector, identify genuine priority gaps and build a 12-month plan the exec team will actually back.",
  },
  {
    Icon: Building2,
    title: "Boards & Execs",
    headline: "A single score the whole C-suite can rally behind.",
    description:
      "Cut through the AI noise with a weighted, sector-aware maturity score. Get the strategic narrative your chair needs and the risk view your CFO will trust.",
  },
];

export function Personas() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  return (
    <section style={{ background: "var(--bg-subtle)" }} className="py-20 md:py-28">
      <div ref={sectionRef} className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto gsap-reveal">
          <p
            className="text-[11px] uppercase tracking-[0.25em]"
            style={{ fontWeight: 600, color: "var(--fg-3)" }}
          >
            Who it&apos;s for
          </p>
          <h2
            className="mt-3 text-3xl md:text-5xl tracking-tight leading-tight"
            style={{ fontWeight: 700, color: "var(--fg-1)" }}
          >
            Built for the people{" "}
            <em style={{ color: "var(--amethyst-link)", fontStyle: "normal" }}>
              driving AI decisions.
            </em>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PERSONAS.map((p) => (
            <div
              key={p.title}
              className="gsap-reveal glow-hover bg-white"
              style={{
                borderRadius: "var(--r-lg)",
                padding: "2rem",
                border: "1px solid var(--parchment-border)",
              }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center mb-5"
                style={{
                  borderRadius: "var(--r-sm)",
                  background: "var(--mysteria-purple)",
                }}
              >
                <p.Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
              </div>
              <p
                className="text-[11px] uppercase tracking-widest"
                style={{ fontWeight: 600, color: "var(--fg-3)" }}
              >
                {p.title}
              </p>
              <h3
                className="mt-2 text-xl tracking-tight leading-snug"
                style={{ fontWeight: 700, color: "var(--fg-1)" }}
              >
                {p.headline}
              </h3>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ fontWeight: 460, color: "var(--fg-2)" }}
              >
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
