"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";

export function FinalCta() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.12 });

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "var(--hero-gradient)",
      }}
    >
      <div ref={sectionRef} className="relative z-10 mx-auto max-w-3xl px-6 md:px-10 py-24 md:py-32 text-center">
        <div
          className="gsap-reveal inline-flex items-center gap-2 px-3 py-1 text-[11px] uppercase tracking-[0.2em] mb-8"
          style={{
            borderRadius: "var(--r-sm)",
            fontWeight: 600,
            color: "var(--white-95)",
            background: "var(--white-10)",
            border: "1px solid var(--white-20)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Sparkles className="h-3 w-3" /> Ready when you are
        </div>
        <h2
          className="gsap-reveal text-4xl md:text-6xl tracking-tight leading-[1.02]"
          style={{ fontWeight: 700, color: "var(--white-95)" }}
        >
          Know your AI gap.{" "}
          <span style={{ color: "var(--lavender-glow)" }}>
            Close it in 12 months.
          </span>
        </h2>
        <p
          className="gsap-reveal mt-6 text-base md:text-lg max-w-xl mx-auto leading-relaxed"
          style={{ fontWeight: 460, color: "var(--white-60)" }}
        >
          Join the leaders getting clarity on AI readiness in under 10 minutes. Start with the free assessment — upgrade when you need benchmarks and the roadmap.
        </p>
        <div className="gsap-reveal mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/app"
            className="group inline-flex items-center justify-center gap-2 text-sm transition hover:scale-[1.02]"
            style={{
              borderRadius: "var(--r-sm)",
              padding: "0.875rem 1.5rem",
              fontWeight: 600,
              color: "var(--charcoal-ink)",
              background: "var(--warm-cream)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            Start free assessment
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center text-sm transition hover:bg-white/5"
            style={{
              borderRadius: "var(--r-sm)",
              padding: "0.875rem 1.5rem",
              fontWeight: 600,
              color: "var(--white-80)",
              background: "transparent",
              border: "1px solid var(--white-20)",
            }}
          >
            See pricing
          </Link>
        </div>
        <p
          className="gsap-reveal mt-5 text-xs"
          style={{ fontWeight: 460, color: "var(--white-60)" }}
        >
          Free forever tier · 7-day Pro trial · Cancel anytime
        </p>
      </div>
    </section>
  );
}
