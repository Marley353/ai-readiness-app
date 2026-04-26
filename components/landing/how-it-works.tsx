"use client";

import { useEffect, useRef } from "react";
import { useScrollReveal } from "@/lib/gsap-hooks";

const STEPS = [
  {
    num: "01",
    color: "#f59e0b",
    title: "Take the 8-Minute Readiness Scorecard",
    body: "Score your organisation across 8 dimensions on a simple 1–5 maturity scale.",
    badge: "8 MINUTES",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" width="72" height="72">
        <circle cx="40" cy="40" r="28" stroke="#f59e0b" strokeWidth="1.5" opacity="0.3" />
        <polygon points="40,16 56,28 52,48 28,48 24,28" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinejoin="round" />
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return <circle key={i} cx={40 + 22 * Math.cos(a)} cy={40 + 22 * Math.sin(a)} r="2.5" fill="#f59e0b" />;
        })}
      </svg>
    ),
  },
  {
    num: "02",
    color: "#8b5cf6",
    title: "See Where You Stand Against Your Sector",
    body: "Benchmark against Cisco Index data from 8,000+ organisations across your industry.",
    badge: "INSTANT BENCHMARK",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" width="72" height="72">
        <rect x="14" y="44" width="10" height="20" rx="2" fill="#8b5cf6" opacity="0.4" />
        <rect x="28" y="34" width="10" height="30" rx="2" fill="#8b5cf6" opacity="0.55" />
        <rect x="42" y="24" width="10" height="40" rx="2" fill="#8b5cf6" opacity="0.7" />
        <rect x="56" y="16" width="10" height="48" rx="2" fill="#8b5cf6" opacity="0.9" />
        <circle cx="56" cy="16" r="4" fill="#8b5cf6" />
        <circle cx="42" cy="24" r="3" fill="#8b5cf6" opacity="0.7" />
      </svg>
    ),
  },
  {
    num: "03",
    color: "#3b82f6",
    title: "Get Your Prioritised 90-Day Action Plan",
    body: "Receive a phased roadmap — Foundation (0–90 days), Build (3–6 months), Scale (6–12 months).",
    badge: "TAILORED ROADMAP",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" width="72" height="72">
        <circle cx="40" cy="36" r="22" stroke="#3b82f6" strokeWidth="2" opacity="0.35" />
        <circle cx="40" cy="36" r="16" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" />
        <text x="40" y="40" textAnchor="middle" fill="#3b82f6" fontSize="18" fontWeight="700">90</text>
        <text x="40" y="54" textAnchor="middle" fill="#3b82f6" fontSize="8" fontWeight="600" letterSpacing="1">DAYS</text>
      </svg>
    ),
  },
  {
    num: "04",
    color: "#14b8a6",
    title: "Track Progress and Reassess Quarterly",
    body: "Retake every 90 days. Pro users see delta view to measure impact and prove progress.",
    badge: "CONTINUOUS IMPROVEMENT",
    icon: (
      <svg viewBox="0 0 80 80" fill="none" width="72" height="72">
        <polyline points="12,56 28,44 42,48 56,28 68,20" stroke="#14b8a6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="64,16 72,20 68,28" fill="#14b8a6" />
        <line x1="12" y1="64" x2="68" y2="64" stroke="#14b8a6" strokeWidth="1" opacity="0.25" />
      </svg>
    ),
  },
];

const STATS = [
  { icon: "⚡", label: "8 Minutes", sub: "Total time to complete", color: "#f59e0b" },
  { icon: "👥", label: "8,000+", sub: "Organisations benchmarked", color: "#8b5cf6" },
  { icon: "🎯", label: "90-Day Plan", sub: "Clear, prioritised actions", color: "#3b82f6" },
  { icon: "📈", label: "Quarterly Tracking", sub: "Measure what moves the needle", color: "#14b8a6" },
];

export function HowItWorks() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.12 });
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = cardsRef.current;
    if (!cards) return;
    const items = cards.querySelectorAll<HTMLElement>(".hiw-card");
    items.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(32px)";
    });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            items.forEach((el, i) => {
              setTimeout(() => {
                el.style.transition = "opacity 0.6s cubic-bezier(.22,1,.36,1), transform 0.6s cubic-bezier(.22,1,.36,1)";
                el.style.opacity = "1";
                el.style.transform = "translateY(0)";
              }, i * 140);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(cards);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="assessment"
      style={{ position: "relative", padding: "120px 24px", background: "#050914", color: "#fff" }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto" }}>
        {/* Header */}
        <div className="gsap-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "4px", marginBottom: 16 }}>
            HOW IT WORKS
          </p>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1px", color: "#fff", margin: "0 0 16px" }}>
            Your 8-Minute <span style={{ color: "rgba(255,255,255,0.5)" }}>Readiness Journey</span>
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", maxWidth: 520, margin: "0 auto" }}>
            Four simple steps to turn AI ambition into a clear, prioritised plan.
          </p>
        </div>

        {/* 4-column cards */}
        <div
          ref={cardsRef}
          className="gsap-reveal"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            position: "relative",
          }}
        >
          {STEPS.map((step, i) => (
            <div key={step.num} className="hiw-card" style={{ display: "flex", alignItems: "stretch" }}>
              {/* Card */}
              <div
                style={{
                  flex: 1,
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  padding: "32px 24px 28px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                {/* Step number */}
                <div
                  style={{
                    position: "absolute",
                    top: -16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: `2px solid ${step.color}`,
                    background: "#0a0e1a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    color: step.color,
                  }}
                >
                  {step.num}
                </div>

                {/* Icon */}
                <div style={{ marginTop: 16, marginBottom: 20, animation: `floatIcon 3s ease-in-out ${i * 0.4}s infinite` }}>
                  {step.icon}
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 12, minHeight: 48 }}>
                  {step.title}
                </h3>

                {/* Body */}
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.5)", marginBottom: 24, flex: 1 }}>
                  {step.body}
                </p>

                {/* Badge */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    color: step.color,
                    border: `1px solid ${step.color}40`,
                    borderRadius: 8,
                    padding: "6px 16px",
                    textTransform: "uppercase",
                  }}
                >
                  {step.badge}
                </span>
              </div>

              {/* Arrow connector */}
              {i < STEPS.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: step.color,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    ›
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div
          className="gsap-reveal"
          style={{
            marginTop: 56,
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            padding: "28px 32px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{s.label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 24px !important;
          }
        }
        @media (max-width: 560px) {
          div[style*="gridTemplateColumns: repeat(4"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="gridTemplateColumns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
