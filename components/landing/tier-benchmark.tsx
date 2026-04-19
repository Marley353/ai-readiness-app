"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";

const TIERS = [
  {
    name: "Laggard",
    percent: "1%",
    description: "No strategy. No infrastructure. AI is someone else's problem.",
    intensity: 10,
  },
  {
    name: "Follower",
    percent: "~35%",
    description: "Experimenting. No systematic approach. Pilots rarely reach production.",
    intensity: 30,
  },
  {
    name: "Chaser",
    percent: "~51%",
    description: "Active pilots and some structure. Scaling is where the wheels come off.",
    intensity: 60,
  },
  {
    name: "Pacesetter",
    percent: "13%",
    description: "Systematic. Scaling. Seeing measurable value. The destination.",
    intensity: 100,
    highlighted: true,
  },
];

export function TierBenchmark() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  return (
    <section className="bg-white py-20 md:py-28">
      <div ref={sectionRef} className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto gsap-reveal">
          <p
            className="text-[11px] uppercase tracking-[0.25em]"
            style={{ fontWeight: 600, color: "var(--fg-3)" }}
          >
            The benchmark
          </p>
          <h2
            className="mt-3 text-3xl md:text-5xl tracking-tight leading-tight"
            style={{ fontWeight: 700, color: "var(--fg-1)" }}
          >
            Where does your organisation{" "}
            <em style={{ color: "var(--amethyst-link)", fontStyle: "normal" }}>
              actually fit?
            </em>
          </h2>
          <p
            className="mt-5 text-base md:text-lg leading-relaxed"
            style={{ fontWeight: 460, color: "var(--fg-2)" }}
          >
            Cisco's research across 8,000+ organisations identifies four distinct readiness tiers. Only 13% are Pacesetters — and the gap between them and everyone else is closing faster than most realise.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-4">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className="gsap-reveal glow-hover"
              style={{
                borderRadius: "var(--r-lg)",
                padding: "1.5rem",
                background: tier.highlighted
                  ? "linear-gradient(160deg, var(--mysteria-purple-3), var(--mysteria-purple-2) 50%, var(--mysteria-purple))"
                  : "var(--bg-subtle)",
                border: tier.highlighted
                  ? "1px solid var(--white-20)"
                  : "1px solid var(--parchment-border)",
                color: tier.highlighted ? "#fff" : undefined,
              }}
            >
              <div
                className="h-1 rounded-full mb-5 overflow-hidden"
                style={{
                  background: tier.highlighted ? "var(--white-10)" : "var(--parchment-border)",
                }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${tier.intensity}%`,
                    background: tier.highlighted
                      ? "linear-gradient(90deg, var(--lavender-glow), var(--amethyst-link))"
                      : "linear-gradient(90deg, var(--fg-3), var(--fg-2))",
                    transition: "width 1s ease-out",
                  }}
                />
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <h3
                  className="text-xl tracking-tight"
                  style={{
                    fontWeight: 700,
                    color: tier.highlighted ? "var(--white-95)" : "var(--fg-1)",
                  }}
                >
                  {tier.name}
                </h3>
                <span
                  className="text-xs tabular-nums"
                  style={{
                    fontWeight: 600,
                    color: tier.highlighted ? "var(--white-60)" : "var(--fg-3)",
                  }}
                >
                  {tier.percent}
                </span>
              </div>

              <p
                className="mt-3 text-sm leading-relaxed"
                style={{
                  fontWeight: 460,
                  color: tier.highlighted ? "var(--white-60)" : "var(--fg-2)",
                }}
              >
                {tier.description}
              </p>
            </div>
          ))}
        </div>

        <div
          className="gsap-reveal mt-10 text-center"
          style={{
            borderRadius: "var(--r-lg)",
            padding: "1.5rem 2rem",
            background: "var(--bg-subtle)",
            border: "1px solid var(--parchment-border)",
          }}
        >
          <p
            className="text-base md:text-lg leading-relaxed max-w-3xl mx-auto"
            style={{ fontWeight: 540, color: "var(--fg-1)" }}
          >
            Pacesetters are{" "}
            <span style={{ fontWeight: 700, color: "var(--amethyst-link)" }}>
              4x more likely to move AI pilots into production
            </span>{" "}
            and{" "}
            <span style={{ fontWeight: 700, color: "var(--amethyst-link)" }}>
              50% more likely to report measurable value
            </span>
            .
          </p>
          <p
            className="mt-3 text-[11px] uppercase tracking-widest"
            style={{ fontWeight: 600, color: "var(--fg-3)" }}
          >
            Cisco AI Readiness Index 2024
          </p>
        </div>

        <div className="gsap-reveal mt-10 text-center">
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 text-sm transition hover:scale-[1.02]"
            style={{
              borderRadius: "var(--r-sm)",
              padding: "0.75rem 1.25rem",
              fontWeight: 600,
              color: "var(--charcoal-ink)",
              background: "var(--warm-cream)",
              boxShadow: "var(--shadow-2)",
            }}
          >
            Find out which tier you're in
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
