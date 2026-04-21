"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";
import React, { useEffect, useRef, useState } from "react";

function useCounter(target: number, duration = 1600) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let raf: number, start: number | null = null;
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
    return () => obs.disconnect();
  }, [target, duration]);
  return { ref, display };
}

const TIERS = [
  { name: "Laggard", range: "0–25", pct: 1, body: "No strategy, no infrastructure. AI is someone else's problem." },
  { name: "Follower", range: "26–50", pct: 35, body: "Experimenting. No systematic approach. Pilots rarely reach production." },
  { name: "Chaser", range: "51–75", pct: 51, body: "Active pilots and some structure. Scaling is where the wheels come off.", highlight: true },
  { name: "Pacesetter", range: "76–100", pct: 13, body: "Systematic. Scaling. Seeing measurable value. The destination." },
];

export function TierBenchmark() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  return (
    <section
      id="tiers"
      style={{
        position: "relative",
        padding: "120px 24px",
        background: "var(--charcoal-ink)",
        color: "var(--white-95)",
      }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <div className="gsap-reveal" style={{ maxWidth: 820 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--lavender-glow)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
            Tier benchmarks
          </span>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", color: "var(--white-95)", margin: 0 }}>
            Where your organisation lands against{" "}
            <em style={{ fontStyle: "italic", color: "var(--lavender-glow)" }}>8,000+ assessed organisations.</em>
          </h2>
          <p style={{ fontSize: 19, lineHeight: 1.55, color: "var(--white-60)", maxWidth: 640, marginTop: 20 }}>
            Anonymized benchmarks from the Cisco AI Readiness Index. You'll know not just where you are, but who's ahead and how the gap closes.
          </p>
        </div>

        {/* Tier cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 56 }} className="tier-grid">
          {TIERS.map((t) => {
            const { ref, display } = useCounter(t.pct);
            return (
              <div
                key={t.name}
                ref={ref}
                className="gsap-reveal"
                style={{
                  position: "relative",
                  border: `1px solid ${t.highlight ? "rgba(255,183,112,0.4)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 16,
                  padding: 28,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  background: t.highlight ? "rgba(255,183,112,0.08)" : "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.5px" }}>{t.range}</span>
                  {t.highlight && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--charcoal-ink)", background: "var(--lavender-glow)", padding: "3px 8px", borderRadius: 6, letterSpacing: "0.5px" }}>
                      YOU ARE HERE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 22, fontWeight: 540, letterSpacing: "-0.4px", color: "var(--white-95)" }}>{t.name}</div>
                <div style={{ fontSize: 48, fontWeight: 540, lineHeight: 1, letterSpacing: "-1.3px", color: "var(--lavender-glow)", marginTop: 8, fontVariantNumeric: "tabular-nums" }}>
                  {t.pct === 1 ? "<1" : display}%
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "0.5px" }}>of assessed orgs</div>
                <p style={{ fontSize: 14, fontWeight: 460, lineHeight: 1.5, color: "rgba(255,255,255,0.7)", margin: "12px 0 0" }}>{t.body}</p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="gsap-reveal" style={{ marginTop: 48, textAlign: "center" }}>
          <Link
            href="/app"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 22px",
              borderRadius: "var(--r-sm)",
              fontSize: 15,
              fontWeight: 600,
              background: "var(--warm-cream)",
              color: "var(--charcoal-ink)",
              textDecoration: "none",
              transition: "background 150ms",
            }}
          >
            Find out which tier you're in
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 980px) { .tier-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px) { .tier-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
