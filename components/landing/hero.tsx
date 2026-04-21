"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// Animated gauge displayed on the right side of the hero
function HeroMeter() {
  const [metric, setMetric] = useState(0);
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const target = 73;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / 1800);
      const eased = 1 - Math.pow(1 - p, 3);
      setMetric(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    const timer = setTimeout(() => { raf = requestAnimationFrame(step); }, 300);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, []);

  const R = 90;
  const C = 2 * Math.PI * R;
  const frac = Math.max(0, Math.min(1, metric / 100));
  const visibleLen = C * 0.75;
  const dashOffset = visibleLen * (1 - frac);

  const bars = [
    { label: "Strategy & leadership", value: 82 },
    { label: "Data foundations", value: 64 },
    { label: "Process maturity", value: 71 },
    { label: "Ethics & governance", value: 58 },
  ];

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "1 / 1.05",
        maxWidth: 520,
        marginLeft: "auto",
        borderRadius: 22,
        overflow: "hidden",
        background: "linear-gradient(160deg, #14131f 0%, #0b0a14 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 30px 80px rgba(41,40,39,0.22), 0 0 0 1px rgba(255,255,255,0.02) inset",
        color: "#fff",
      }}
    >
      {/* Grid bg */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 0%, transparent 75%)",
        }}
      />
      {/* Orbs */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "var(--lavender-glow)",
          filter: "blur(90px)",
          opacity: 0.35,
          top: -40,
          right: -60,
          animation: "floatXY 14s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "var(--amethyst-link)",
          filter: "blur(80px)",
          opacity: 0.25,
          bottom: -20,
          left: -40,
          animation: "floatY 12s 1s ease-in-out infinite",
        }}
      />

      {/* Top chrome */}
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.4px", textTransform: "uppercase" as const }}>
          Readiness Scorecard · v2
        </div>
        <div style={{ width: 28, height: 8 }} />
      </div>

      {/* Gauge */}
      <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", width: 240, height: 240 }}>
        <svg viewBox="0 0 220 220" width="240" height="240" style={{ transform: "rotate(135deg)" }}>
          <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeDasharray={`${visibleLen} ${C}`} strokeLinecap="round" />
          <circle cx="110" cy="110" r={R} fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeDasharray={`${visibleLen} ${C}`} strokeDashoffset={dashOffset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 200ms linear" }} />
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--lavender-glow)" />
              <stop offset="100%" stopColor="#fff" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "0.3px", textTransform: "uppercase" as const, marginBottom: 6 }}>AI readiness</div>
          <div style={{ fontSize: 64, fontWeight: 540, color: "#fff", letterSpacing: "-2px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{Math.round(metric)}</div>
          <div style={{ fontSize: 13, fontWeight: 540, color: "var(--lavender-glow)", marginTop: 6 }}>Implementation-ready</div>
        </div>
      </div>

      {/* Glass panel with bars */}
      <div
        className="glass glass-strong"
        style={{ position: "absolute", left: 20, right: 20, bottom: 20, padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(14px) saturate(1.2)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.6)" }}>
          <span>Pillar breakdown</span>
          <span style={{ color: "var(--lavender-glow)" }}>● Live</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bars.map((b, i) => (
            <div key={b.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
                <span>{b.label}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "rgba(255,255,255,0.6)" }}>{b.value}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 2,
                    width: `${b.value}%`,
                    background: "linear-gradient(90deg, var(--lavender-glow), #fff)",
                    transformOrigin: "left",
                    animation: `fillBar 1.4s ${0.4 + i * 0.15}s cubic-bezier(0.22,0.61,0.36,1) both`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating mini card */}
      <div
        className="glass"
        style={{
          position: "absolute",
          top: 72,
          right: 18,
          padding: "10px 12px",
          borderRadius: 14,
          fontSize: 11,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          animation: "floatY 5s ease-in-out infinite",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lavender-glow)" }} />
        Analyzing dimension 5/8
      </div>
    </div>
  );
}

// Counter hook for stat mini
function useCounter(target: number, duration: number = 1600) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let raf: number;
          let start: number | null = null;
          const step = (t: number) => {
            if (start === null) start = t;
            const p = Math.min(1, (t - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(target * eased));
            if (p < 1) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { ref, display };
}

function StatMini({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, display } = useCounter(value);
  return (
    <div ref={ref}>
      <div style={{ fontSize: 28, fontWeight: 540, letterSpacing: "-0.8px", color: "var(--fg-1)" }}>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{display}</span>
        <span style={{ color: "var(--fg-3)", fontWeight: 460 }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

export function Hero() {
  const btnRef = useRef<HTMLAnchorElement>(null);

  // Mouse-tracked radial glow on CTA
  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      className="hero"
      style={{
        position: "relative",
        padding: "72px 24px 96px",
        overflow: "hidden",
      }}
    >
      {/* Topographic contour background */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: 0.07,
        }}
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Organic contour lines — generated to feel like a readiness terrain map */}
        <path d="M0 400 Q150 320 300 380 T600 340 T900 400 T1200 360" stroke="var(--charcoal-ink)" strokeWidth="1.2" />
        <path d="M0 440 Q180 380 360 420 T720 370 T1080 430 T1200 400" stroke="var(--charcoal-ink)" strokeWidth="1" />
        <path d="M0 480 Q200 420 400 460 T800 400 T1200 440" stroke="var(--charcoal-ink)" strokeWidth="0.8" />
        <path d="M0 360 Q120 300 240 340 T480 290 T720 350 T960 310 T1200 340" stroke="var(--charcoal-ink)" strokeWidth="1.4" />
        <path d="M0 320 Q160 260 320 300 T640 250 T960 300 T1200 280" stroke="var(--charcoal-ink)" strokeWidth="1" />
        <path d="M0 520 Q220 470 440 510 T880 450 T1200 490" stroke="var(--charcoal-ink)" strokeWidth="0.8" />
        <path d="M0 280 Q100 240 200 260 T400 220 T600 270 T800 230 T1000 260 T1200 240" stroke="var(--charcoal-ink)" strokeWidth="0.6" />
        <path d="M0 560 Q250 510 500 550 T1000 490 T1200 530" stroke="var(--charcoal-ink)" strokeWidth="0.6" />
        <path d="M0 240 Q140 200 280 230 T560 190 T840 240 T1120 210 T1200 220" stroke="var(--charcoal-ink)" strokeWidth="0.5" />
        <path d="M0 600 Q280 560 560 590 T1120 540 T1200 570" stroke="var(--charcoal-ink)" strokeWidth="0.5" />
        {/* Inner contours — tighter rings suggesting a "peak" at centre-left */}
        <path d="M200 350 Q300 300 400 340 T600 310 T700 350" stroke="var(--charcoal-ink)" strokeWidth="1.6" />
        <path d="M250 380 Q330 340 420 370 T580 340 T660 380" stroke="var(--charcoal-ink)" strokeWidth="1.3" />
        <path d="M300 370 Q360 350 430 365 T550 350 T620 370" stroke="var(--charcoal-ink)" strokeWidth="1" />
        {/* Faint outer contours for depth */}
        <path d="M0 200 Q100 170 200 190 T400 160 T600 200 T800 170 T1000 200 T1200 180" stroke="var(--charcoal-ink)" strokeWidth="0.3" />
        <path d="M0 640 Q300 600 600 630 T1200 600" stroke="var(--charcoal-ink)" strokeWidth="0.3" />
        <path d="M0 160 Q150 130 300 155 T600 130 T900 160 T1200 140" stroke="var(--charcoal-ink)" strokeWidth="0.25" />
        <path d="M0 680 Q350 650 700 670 T1200 640" stroke="var(--charcoal-ink)" strokeWidth="0.25" />
      </svg>

      {/* Floating orbs */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            width: 540,
            height: 540,
            borderRadius: "50%",
            background: "rgba(255,183,112,0.55)",
            filter: "blur(80px)",
            opacity: 0.35,
            top: -120,
            left: "45%",
            animation: "floatXY 14s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "#b4d4ff",
            filter: "blur(80px)",
            opacity: 0.22,
            bottom: -100,
            left: -80,
            animation: "floatY 9s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,183,112,0.35)",
            filter: "blur(80px)",
            opacity: 0.3,
            top: 40,
            right: -60,
            animation: "floatXY 14s ease-in-out infinite",
          }}
        />
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        {/* Two-column grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 1fr",
            gap: 64,
            alignItems: "center",
            marginTop: 40,
          }}
          className="hero-grid"
        >
          {/* Left — copy */}
          <div>
            <h1
              style={{
                fontSize: "clamp(38px, 4.5vw, 64px)",
                fontWeight: 540,
                lineHeight: 1.0,
                letterSpacing: "-1.8px",
                color: "var(--fg-1)",
                margin: 0,
                maxWidth: 720,
              }}
            >
              Know where your organisation stands on{" "}
              <em style={{ fontStyle: "italic" }}>AI readiness</em>
              .
            </h1>
            <p
              style={{
                fontSize: 19,
                lineHeight: 1.55,
                color: "var(--fg-2)",
                maxWidth: 560,
                margin: "24px 0 32px",
                fontWeight: 460,
              }}
            >
              Replace vague "AI strategy" with a high-fidelity system — a readiness
              diagnosis, capability map, and 12-month blueprint your team can ship.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Link
                ref={btnRef}
                href="/app"
                className="btn btn-primary"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  padding: "14px 22px",
                  fontSize: 15,
                  textDecoration: "none",
                  borderRadius: "var(--r-sm)",
                  background: "var(--charcoal-ink)",
                  color: "#fff",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 6px 20px rgba(41,40,39,0.18)",
                }}
              >
                <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  Start your readiness scorecard
                  <ArrowRight size={15} />
                </span>
              </Link>
              <Link
                href="#how-it-works"
                className="btn btn-secondary"
                style={{
                  padding: "14px 22px",
                  fontSize: 15,
                  textDecoration: "none",
                  borderRadius: "var(--r-sm)",
                  background: "transparent",
                  color: "var(--fg-1)",
                  border: "1px solid var(--border-2)",
                }}
              >
                See the framework
              </Link>
            </div>

            {/* Trust signals below CTA */}
            <div style={{ marginTop: 20, display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12, color: "var(--fg-3)" }}>
              <span>✓ No credit card</span>
              <span>✓ Results in 8 minutes</span>
              <span>✓ 7-day Pro trial</span>
            </div>

            {/* Stat minis */}
            <div style={{ marginTop: 48, display: "flex", gap: 32, flexWrap: "wrap" }}>
              <StatMini value={13} suffix="%" label="qualify as AI Pacesetters" />
              <StatMini value={8} suffix=" min" label="to full readiness score" />
              <StatMini value={8} suffix="" label="dimensions assessed" />
            </div>
          </div>

          {/* Right — video demo in scorecard frame */}
          <div>
            <div
              style={{
                position: "relative",
                maxWidth: 520,
                marginLeft: "auto",
                borderRadius: 22,
                overflow: "hidden",
                background: "linear-gradient(160deg, #14131f 0%, #0b0a14 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 30px 80px rgba(41,40,39,0.22), 0 0 0 1px rgba(255,255,255,0.02) inset",
              }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                poster="/hero-demo-poster.jpg"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              >
                <source src="/hero-demo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>

      {/* CSS animations & responsive */}
      <style jsx global>{`
        @keyframes floatY {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -32px, 0); }
        }
        @keyframes floatXY {
          0% { transform: translate3d(0, 0, 0); }
          33% { transform: translate3d(24px, -20px, 0); }
          66% { transform: translate3d(-16px, -40px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(255,183,112,0.6); }
          100% { box-shadow: 0 0 0 12px rgba(255,183,112,0); }
        }
        @keyframes fillBar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @media (max-width: 980px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}
