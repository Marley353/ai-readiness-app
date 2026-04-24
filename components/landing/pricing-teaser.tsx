"use client";

import Link from "next/link";
import { PRICING } from "@/lib/plans";
import { useScrollReveal } from "@/lib/gsap-hooks";

export function PricingTeaser() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  return (
    <section
      id="pricing"
      style={{
        position: "relative",
        padding: "120px 24px",
        background: "#050914",
        color: "#fff",
      }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto" }}>

        {/* Header */}
        <div className="gsap-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--lavender-glow)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
            Pricing
          </span>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", color: "#fff", margin: 0 }}>
            Start with a score.{" "}
            <em style={{ fontStyle: "italic" }}>Upgrade when you need a plan.</em>
          </h2>
          <p style={{ fontSize: 19, fontWeight: 460, lineHeight: 1.55, color: "rgba(255,255,255,0.6)", maxWidth: 640, margin: "20px auto 0" }}>
            The assessment is free. The roadmap, benchmarks, and board-ready outputs are where the real value sits.
          </p>
        </div>

        {/* Cards */}
        <div className="gsap-reveal pricing-grid" style={{ display: "grid", gap: 24, alignItems: "stretch" }}>

          {/* FREE */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Scorecard</p>
              <h3 style={{ fontSize: 32, fontWeight: 540, color: "#fff", margin: "0 0 16px" }}>Free</h3>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, marginBottom: 24 }}>
                Get a clear, defensible baseline of your AI readiness.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "32-question assessment",
                  "AI readiness score (0–100)",
                  "8-dimension breakdown",
                  "Sector benchmark comparison",
                  "Basic PDF export",
                ].map((f) => (
                  <li key={f} style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--lavender-glow)" }}>•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })}
              className="hover:scale-105 transition-all duration-200 cta-glow"
              style={{
                marginTop: 32,
                width: "100%",
                padding: "14px 20px",
                background: "var(--lavender-glow)",
                color: "#080D1A",
                fontWeight: 600,
                fontSize: 15,
                borderRadius: "var(--r-sm)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Start Free Assessment
            </button>
          </div>

          {/* PRO (HIGHLIGHTED) */}
          <div style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            border: "2px solid var(--lavender-glow)",
            borderRadius: 16,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: 16,
              right: 16,
              fontSize: 11,
              fontWeight: 700,
              background: "var(--lavender-glow)",
              color: "#080D1A",
              padding: "4px 12px",
              borderRadius: 999,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
            }}>
              Most Popular
            </div>
            <div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Pro</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                <h3 style={{ fontSize: 32, fontWeight: 540, color: "#fff", margin: 0 }}>£{PRICING.monthly.amount}</h3>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>/ month</span>
              </div>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, marginBottom: 24 }}>
                Turn your score into a structured AI transformation plan.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "Everything in Free",
                  "12-month AI roadmap",
                  "Priority action plan (90 days)",
                  "Full benchmark visibility",
                  "Clean board-ready PDF export",
                  "Compare multiple assessments",
                ].map((f) => (
                  <li key={f} style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--lavender-glow)" }}>•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/pricing"
              className="hover:scale-105 transition-all duration-200 cta-glow"
              style={{
                marginTop: 32,
                width: "100%",
                padding: "14px 20px",
                background: "var(--lavender-glow)",
                color: "#080D1A",
                fontWeight: 600,
                fontSize: 15,
                borderRadius: "var(--r-sm)",
                textDecoration: "none",
                textAlign: "center",
                display: "block",
              }}
            >
              Start Pro Trial
            </Link>
          </div>

          {/* ANNUAL */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Annual</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                <h3 style={{ fontSize: 32, fontWeight: 540, color: "#fff", margin: 0 }}>£{PRICING.annual.amount}</h3>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>/ year</span>
              </div>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, marginBottom: 24 }}>
                Best for teams embedding AI into long-term operations.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "Everything in Pro",
                  "Save ~28%",
                  "Priority feature access",
                  "Ongoing reassessment tracking",
                ].map((f) => (
                  <li key={f} style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--lavender-glow)" }}>•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/pricing"
              className="hover:scale-105 transition-all duration-200 cta-glow"
              style={{
                marginTop: 32,
                width: "100%",
                padding: "14px 20px",
                background: "transparent",
                color: "var(--lavender-glow)",
                fontWeight: 600,
                fontSize: 15,
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--lavender-glow)",
                textDecoration: "none",
                textAlign: "center",
                display: "block",
              }}
            >
              Start Pro Trial
            </Link>
          </div>
        </div>

        {/* Bottom reinforcement */}
        <div className="gsap-reveal" style={{ textAlign: "center", marginTop: 48 }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            No credit card required for the free assessment.
          </p>
        </div>
      </div>

      <style jsx global>{`
        .pricing-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 980px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
            max-width: 480px;
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>
    </section>
  );
}
