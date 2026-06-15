"use client";

import { useScrollReveal } from "@/lib/gsap-hooks";
import { CtaButton } from "./cta-button";
import React, { useEffect, useRef, useState } from "react";

function useCounter(target: number, duration = 1600) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target);
      return;
    }
    let raf = 0;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start: number | null = null;
        const step = (t: number) => {
          if (start === null) start = t;
          const p = Math.min(1, (t - start) / duration);
          setDisplay(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration]);
  return { ref, display };
}

const TIERS = [
  { name: "Laggard", internal: "Early", range: "0–25", pct: 1, body: "No strategy, no infrastructure. AI is someone else's problem." },
  { name: "Follower", internal: "Emerging", range: "26–50", pct: 35, body: "Experimenting. No systematic approach. Pilots rarely reach production." },
  { name: "Chaser", internal: "Progressing", range: "51–75", pct: 51, body: "Active pilots and some structure. Scaling is where the wheels come off.", highlight: true },
  { name: "Pacesetter", internal: "Advanced", range: "76–100", pct: 13, body: "Systematic. Scaling. Seeing measurable value. The destination." },
];

type Tier = (typeof TIERS)[number];

function TierCard({ tier }: { tier: Tier }) {
  const { ref, display } = useCounter(tier.pct);
  return (
    <div
      ref={ref}
      className="gsap-reveal"
      style={{
        position: "relative",
        border: `1px solid ${tier.highlight ? "rgba(255,183,112,0.4)" : "var(--parchment-border)"}`,
        borderRadius: 16,
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: tier.highlight ? "rgba(255,183,112,0.08)" : "var(--pure-white)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--fg-3)", letterSpacing: "0.5px" }}>{tier.range}</span>
        {tier.highlight && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--charcoal-ink)", background: "var(--lavender-glow)", padding: "3px 8px", borderRadius: 6, letterSpacing: "0.5px" }}>
            YOU ARE HERE
          </span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 540, letterSpacing: "-0.4px", color: "var(--fg-1)" }}>{tier.name}</div>
      <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>({tier.internal})</div>
      <div style={{ fontSize: 48, fontWeight: 540, lineHeight: 1, letterSpacing: "-1.3px", color: "var(--lavender-glow)", marginTop: 8, fontVariantNumeric: "tabular-nums" }}>
        {tier.pct === 1 ? "<1" : display}%
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", letterSpacing: "0.5px" }}>of assessed orgs</div>
      <p style={{ fontSize: 14, fontWeight: 460, lineHeight: 1.5, color: "var(--fg-2)", margin: "12px 0 0" }}>{tier.body}</p>
    </div>
  );
}

export function TierBenchmark() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  return (
    <section
      id="tiers"
      style={{
        position: "relative",
        padding: "120px 24px",
        background: "var(--bg-page-2, #f2ede4)",
      }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <div className="gsap-reveal" style={{ maxWidth: 820 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amethyst-link)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
            Tier benchmarks
          </span>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", color: "var(--fg-1)", margin: 0 }}>
            Where your organisation lands against{" "}
            <em style={{ fontStyle: "italic", color: "var(--amethyst-link)" }}>8,000+ assessed organisations.</em>
          </h2>
          <p style={{ fontSize: 19, lineHeight: 1.55, color: "var(--fg-2)", maxWidth: 640, marginTop: 20 }}>
            Anonymized benchmarks from the Cisco AI Readiness Index. You'll know not just where you are, but who's ahead and how the gap closes.
          </p>
        </div>

        {/* Tier cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 56 }} className="tier-grid">
          {TIERS.map((t) => (
            <TierCard key={t.name} tier={t} />
          ))}
        </div>

        {/* CTA */}
        <div className="gsap-reveal" style={{ marginTop: 48, textAlign: "center" }}>
          <CtaButton>Start Free Assessment</CtaButton>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 980px) { .tier-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px) { .tier-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
