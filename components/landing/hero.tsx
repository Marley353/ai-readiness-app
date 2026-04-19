"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";

export function Hero() {
  const heroRef = useScrollReveal<HTMLDivElement>({ y: 0, stagger: 0.12, start: "top 95%" });

  return (
    <section
      style={{
        position: "relative",
        background: "var(--hero-gradient)",
        padding: "140px 40px 160px",
        overflow: "hidden",
        color: "var(--white-95)",
        textAlign: "center",
      }}
    >
      {/* Glow orbs */}
      <div style={{ position: "absolute", width: 560, height: 560, borderRadius: "50%", background: "#cbb7fb", filter: "blur(140px)", opacity: 0.22, top: -140, right: -120, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", background: "#714cb6", filter: "blur(160px)", opacity: 0.28, bottom: -160, left: -120, pointerEvents: "none" }} />
      {/* Star field */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.35), transparent)," +
            "radial-gradient(1px 1px at 70% 50%, rgba(255,255,255,0.3), transparent)," +
            "radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.25), transparent)," +
            "radial-gradient(1px 1px at 85% 20%, rgba(203,183,251,0.5), transparent)," +
            "radial-gradient(1px 1px at 15% 80%, rgba(203,183,251,0.45), transparent)",
        }}
      />

      <div ref={heroRef} style={{ maxWidth: 1120, margin: "0 auto", position: "relative" }}>
        {/* Badge */}
        <div className="gsap-reveal" style={{ marginBottom: 32 }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 12px",
              background: "rgba(203,183,251,0.15)",
              color: "#cbb7fb",
              border: "1px solid rgba(203,183,251,0.3)",
              borderRadius: "var(--r-sm)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            READINESS SCORECARD — NOW LIVE
          </span>
        </div>

        {/* Headline */}
        <h1
          className="gsap-reveal"
          style={{
            fontSize: 70,
            fontWeight: 540,
            lineHeight: 0.96,
            letterSpacing: "-2.4px",
            margin: 0,
            maxWidth: 940,
            color: "var(--white-95)",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Know exactly where your
          <br />
          organisation stands on{" "}
          <em style={{ fontStyle: "normal", color: "#cbb7fb", fontWeight: 540 }}>AI</em>.
        </h1>

        {/* Who it's for */}
        <p
          className="gsap-reveal"
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1px",
            color: "rgba(255,255,255,0.55)",
            marginTop: 24,
          }}
        >
          FOR BUSINESS LEADERS · TRANSFORMATION LEADS · AI IMPLEMENTERS
        </p>

        {/* Subhead */}
        <p
          className="gsap-reveal"
          style={{
            fontSize: 20,
            fontWeight: 460,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.8)",
            marginTop: 28,
            maxWidth: 620,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Replace vague "AI strategy" with a high-fidelity system — a readiness
          diagnosis, capability map, and two-quarter blueprint your team can ship.
        </p>

        {/* CTAs */}
        <div className="gsap-reveal" style={{ display: "flex", gap: 16, marginTop: 44, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/app"
            style={{
              background: "var(--warm-cream)",
              color: "var(--charcoal-ink)",
              padding: "16px 24px",
              borderRadius: "var(--r-sm)",
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 150ms",
            }}
          >
            See your AI readiness score →
          </Link>
          <Link
            href="#how-it-works"
            style={{
              background: "transparent",
              color: "var(--white-95)",
              padding: "16px 24px",
              borderRadius: "var(--r-sm)",
              border: "1px solid rgba(255,255,255,0.2)",
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 150ms",
            }}
          >
            Explore the framework
          </Link>
        </div>

        {/* Trial hint */}
        <p className="gsap-reveal" style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          Free forever tier · <strong style={{ color: "rgba(255,255,255,0.75)" }}>7-day Pro trial</strong> included · No credit card to start
        </p>

        {/* Social proof — adjacent to CTAs */}
        <figure className="gsap-reveal" style={{ marginTop: 56, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
          <blockquote style={{ fontSize: 17, fontWeight: 460, lineHeight: 1.5, color: "rgba(255,255,255,0.8)", fontStyle: "italic", margin: 0 }}>
            "The framework gave our leadership team a shared language for something we'd been struggling to align on for 18 months."
          </blockquote>
          <figcaption style={{ marginTop: 12, fontSize: 13, fontWeight: 540, color: "rgba(255,255,255,0.55)" }}>
            — Head of Digital Transformation, UK Retail
          </figcaption>
        </figure>

        {/* AI trust signals */}
        <div
          className="gsap-reveal"
          style={{
            marginTop: 48,
            maxWidth: 640,
            marginLeft: "auto",
            marginRight: "auto",
            borderRadius: "var(--r-lg)",
            padding: 24,
            background: "rgba(203,183,251,0.08)",
            border: "1px solid rgba(203,183,251,0.2)",
            textAlign: "left",
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: "#cbb7fb", marginBottom: 14 }}>
            HOW THIS PLATFORM USES AI
          </p>
          <ul style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", margin: 0, padding: 0, listStyle: "none" }}>
            {[
              "AI helps interpret your responses and benchmark your score",
              "You review and control all recommendations before acting",
              "No data is used to train third-party AI models",
              "Your results are yours — export or delete at any time",
            ].map((item) => (
              <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, fontWeight: 460, color: "rgba(255,255,255,0.75)" }}>
                <Check style={{ marginTop: 2, width: 14, height: 14, flexShrink: 0, color: "#cbb7fb" }} strokeWidth={2.5} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust bar */}
        <div className="gsap-reveal" style={{ marginTop: 48, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 32, fontSize: 12, fontWeight: 460, color: "rgba(255,255,255,0.5)" }}>
          <span>✓ Built on Cisco data from 8,000+ organisations</span>
          <span>✓ Results in 8 minutes</span>
          <span>✓ WCAG 2.1 AA accessible</span>
        </div>
      </div>
    </section>
  );
}
