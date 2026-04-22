"use client";

import Link from "next/link";

export function Hero() {
  return (
    <section
      id="hero"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom, #000000, #171717)",
        color: "#fff",
      }}
    >
      <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        {/* Brand Tagline */}
        <p style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.15em", color: "#a3a3a3", marginBottom: 16 }}>
          AI Readiness Assessment — Never Trust. Always Verify.
        </p>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 24 }}>
          Measure your organisation's AI readiness in minutes
        </h1>

        {/* Subheading */}
        <p style={{ fontSize: "clamp(18px, 2vw, 20px)", color: "#d4d4d4", maxWidth: 768, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Benchmark your business across 8 critical dimensions and identify where AI will deliver measurable operational and financial impact.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "center", alignItems: "center", marginBottom: 16 }} className="hero-ctas">
          <Link
            href="/app"
            style={{
              padding: "16px 32px",
              background: "#fff",
              color: "#000",
              fontWeight: 600,
              borderRadius: 12,
              textDecoration: "none",
              fontSize: 16,
              transition: "opacity 150ms",
            }}
          >
            Start Free Assessment
          </Link>
          <Link
            href="#scorecard"
            style={{
              padding: "16px 32px",
              background: "transparent",
              color: "#fff",
              fontWeight: 600,
              borderRadius: 12,
              border: "1px solid #fff",
              textDecoration: "none",
              fontSize: 16,
              transition: "all 150ms",
            }}
          >
            View Sample Report
          </Link>
        </div>

        {/* Micro Trust Line */}
        <p style={{ fontSize: 14, color: "#a3a3a3", marginBottom: 24 }}>
          Takes 3–5 minutes • No technical knowledge required
        </p>

        {/* Stat Strip */}
        <div style={{ marginTop: 24, fontSize: 14, color: "#d4d4d4" }}>
          <span style={{ fontWeight: 600, color: "#fff" }}>Only 13%</span> of organisations are fully AI-ready
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 768px) {
          .hero-ctas {
            flex-direction: row !important;
          }
        }
      `}</style>
    </section>
  );
}
