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
        overflow: "hidden",
        color: "#fff",
      }}
    >
      {/* Background image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/hero-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center right",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Dark gradient overlay — strong on left for text, fades toward right to reveal dashboard */}
      <div
        className="hero-overlay"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.2) 75%, transparent 100%)",
        }}
      />

      {/* Bottom fade to blend into next section */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 140,
          background: "linear-gradient(to bottom, transparent, #0a0a0a)",
        }}
      />

      {/* Content — left half only */}
      <div
        className="hero-content"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          padding: "0 32px",
        }}
      >
        {/* Brand Tagline */}
        <p style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.15em", color: "#a3a3a3", marginBottom: 16 }}>
          AI Readiness Assessment — Never Trust. Always Verify.
        </p>

        {/* Headline */}
        <h1
          className="hero-headline"
          style={{
            fontSize: "clamp(32px, 4.5vw, 56px)",
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          Measure your organisation's
          <br />
          <span style={{ color: "#ffb770" }}>AI readiness</span> in minutes
        </h1>

        {/* Subheading */}
        <p
          className="hero-sub"
          style={{
            fontSize: "clamp(16px, 1.8vw, 19px)",
            color: "#d4d4d4",
            marginBottom: 36,
            lineHeight: 1.65,
          }}
        >
          Benchmark your business across 8 critical dimensions and identify
          <br className="hide-mobile" />
          where AI will deliver measurable operational and financial impact.
        </p>

        {/* CTA Buttons */}
        <div className="hero-ctas" style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          <button
            onClick={() => document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:opacity-90 hover:scale-105 transition-all duration-200"
            style={{ border: "none", cursor: "pointer", fontSize: 15 }}
          >
            Start Free Assessment
          </button>
          <Link
            href="#scorecard"
            style={{
              display: "inline-block",
              padding: "15px 32px",
              background: "transparent",
              color: "#fff",
              fontWeight: 600,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.35)",
              textDecoration: "none",
              fontSize: 15,
              textAlign: "center",
              transition: "all 150ms",
            }}
          >
            View Sample Report
          </Link>
        </div>

        {/* Micro Trust Line */}
        <p style={{ fontSize: 13, color: "#a3a3a3", marginBottom: 28 }}>
          Takes 3–5 minutes • No technical knowledge required
        </p>

        {/* Stat Strip */}
        <div style={{ fontSize: 14, color: "#d4d4d4" }}>
          <span style={{ fontWeight: 600, color: "#fff" }}>Only 13%</span> of organisations are fully AI-ready
        </div>
      </div>

      <style jsx global>{`
        .hero-content {
          text-align: left;
        }
        .hero-sub {
          max-width: 480px;
        }
        .hero-headline {
          max-width: 540px;
        }
        .hero-ctas {
          max-width: 420px;
        }
        .hide-mobile {
          display: none;
        }

        @media (min-width: 768px) {
          .hero-ctas {
            flex-direction: row !important;
          }
          .hero-sub {
            max-width: 500px;
          }
          .hide-mobile {
            display: inline;
          }
        }

        @media (max-width: 767px) {
          .hero-content {
            text-align: center;
          }
          .hero-sub,
          .hero-headline,
          .hero-ctas {
            max-width: 100% !important;
          }
          .hero-ctas {
            align-items: center;
          }
          .hero-overlay {
            background: rgba(0,0,0,0.82) !important;
          }
        }
      `}</style>
    </section>
  );
}
