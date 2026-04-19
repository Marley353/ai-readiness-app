"use client";

import { useScrollReveal } from "@/lib/gsap-hooks";

const STATS = [
  {
    value: "15%",
    headline: "of organisations have infrastructure ready for AI workloads",
    source: "Cisco AI Readiness Index 2024",
  },
  {
    value: "76% vs 19%",
    headline: "top performers with fully centralised data vs. all organisations",
    source: "Cisco AI Readiness Index 2024",
  },
  {
    value: "46%",
    headline: "of leaders cite skills gaps as their primary AI adoption barrier",
    source: "McKinsey State of AI 2024",
  },
];

export function AiGap() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  return (
    <section style={{ background: "var(--bg-subtle)" }} className="py-20 md:py-28">
      <div ref={sectionRef} className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto gsap-reveal">
          <p
            className="text-[11px] uppercase tracking-[0.25em]"
            style={{ fontWeight: 600, color: "var(--fg-3)" }}
          >
            The AI Readiness Gap
          </p>
          <h2
            className="mt-3 text-3xl md:text-5xl tracking-tight leading-tight"
            style={{ fontWeight: 700, color: "var(--fg-1)" }}
          >
            Most organisations are{" "}
            <span style={{ color: "var(--fg-2)" }}>experimenting with AI.</span>{" "}
            <em style={{ color: "var(--amethyst-link)", fontStyle: "normal" }}>
              Very few are ready for it.
            </em>
          </h2>
          <p
            className="mt-5 text-base md:text-lg leading-relaxed"
            style={{ fontWeight: 460, color: "var(--fg-2)" }}
          >
            The research tells a consistent story — the difference between AI pacesetters and everyone else isn't budget or ambition. It's foundational readiness.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.value}
              className="gsap-reveal glow-hover bg-white"
              style={{
                borderRadius: "var(--r-lg)",
                padding: "1.75rem",
                border: "1px solid var(--parchment-border)",
              }}
            >
              <p
                className="text-5xl md:text-6xl tracking-tighter leading-none"
                style={{ fontWeight: 700, color: "var(--amethyst-link)" }}
              >
                {s.value}
              </p>
              <p
                className="mt-4 text-sm leading-relaxed"
                style={{ fontWeight: 540, color: "var(--fg-1)" }}
              >
                {s.headline}
              </p>
              <p
                className="mt-4 text-[11px] uppercase tracking-widest"
                style={{ fontWeight: 600, color: "var(--fg-3)" }}
              >
                {s.source}
              </p>
            </div>
          ))}
        </div>

        <p
          className="gsap-reveal mt-10 mx-auto max-w-2xl text-center text-sm italic leading-relaxed"
          style={{ fontWeight: 460, color: "var(--fg-2)" }}
        >
          "AI is no longer a future consideration. It's a present-day performance gap — and the organisations that are winning have already built the foundations most are still debating."
        </p>
      </div>
    </section>
  );
}
