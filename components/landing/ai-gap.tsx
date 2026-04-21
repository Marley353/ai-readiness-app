"use client";

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

const STATS = [
  { value: 15, suffix: "%", label: "of organisations have infrastructure ready for AI workloads", source: "Cisco AI Readiness Index" },
  { value: 76, suffix: "%", label: "of top performers have centralised data — only 19% of all organisations do", source: "Cisco AI Readiness Index" },
  { value: 46, suffix: "%", label: "of leaders cite skills gaps as their primary AI adoption barrier", source: "McKinsey State of AI" },
  { value: 13, suffix: "%", label: "of organisations qualify as AI Pacesetters", source: "Cisco AI Readiness Index" },
];

export function AiGap() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  return (
    <section
      id="scorecard"
      style={{ position: "relative", padding: "120px 24px" }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <div className="gsap-reveal">
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amethyst-link)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
            The AI Readiness Gap
          </span>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", maxWidth: 820, color: "var(--fg-1)", margin: 0 }}>
            The numbers are sobering.
          </h2>
          <p style={{ fontSize: 19, lineHeight: 1.55, color: "var(--fg-2)", maxWidth: 640, marginTop: 20 }}>
            The research tells a consistent story — the difference between AI pacesetters and everyone else isn't budget or ambition. It's foundational readiness.
          </p>
        </div>

        {/* Metrics grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginTop: 48 }} className="metrics-grid">
          {STATS.map((s, i) => {
            const { ref, display } = useCounter(s.value);
            return (
              <div
                key={s.label}
                ref={ref}
                className="gsap-reveal"
                style={{
                  padding: "32px 24px",
                  borderRadius: 16,
                  background: "var(--pure-white)",
                  border: "1px solid var(--parchment-border)",
                  transition: "transform 260ms ease, border-color 260ms ease",
                }}
              >
                <div style={{ fontSize: "clamp(44px, 5.2vw, 64px)", fontWeight: 540, lineHeight: 1, letterSpacing: "-2px", color: "var(--fg-1)", fontVariantNumeric: "tabular-nums" }}>
                  <span>{display}</span>
                  <span style={{ fontSize: "0.55em", color: "var(--fg-3)", fontWeight: 460, marginLeft: 4 }}>{s.suffix}</span>
                </div>
                <div style={{ marginTop: 12, fontSize: 14.5, color: "var(--fg-2)", lineHeight: 1.45 }}>{s.label}</div>
                <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: "var(--fg-3)", textTransform: "uppercase" as const, letterSpacing: "0.4px" }}>{s.source}</div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 980px) { .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px) { .metrics-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
