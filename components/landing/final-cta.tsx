"use client";

import Link from "next/link";
import { useScrollReveal } from "@/lib/gsap-hooks";

export function FinalCta() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.12 });

  return (
    <section
      id="final-cta"
      style={{
        position: "relative",
        padding: "120px 24px",
        overflow: "hidden",
        background: "var(--bg-page-2, #f2ede4)",
        borderTop: "1px solid var(--parchment-border)",
        borderBottom: "1px solid var(--parchment-border)",
      }}
    >
      {/* Ambient grid */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(to right, rgba(41,40,39,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(41,40,39,0.055) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 0%, transparent 75%)",
        }}
      />

      {/* Floating orbs */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "rgba(255,183,112,0.5)",
            filter: "blur(80px)",
            opacity: 0.3,
            top: -140,
            left: "20%",
            animation: "floatXY 14s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "#ffb770",
            filter: "blur(80px)",
            opacity: 0.18,
            bottom: -140,
            right: "15%",
            animation: "floatY 9s ease-in-out infinite",
          }}
        />
      </div>

      <div
        ref={sectionRef}
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h2
          className="gsap-reveal"
          style={{
            fontSize: "clamp(40px, 5.4vw, 72px)",
            fontWeight: 460,
            lineHeight: 0.98,
            letterSpacing: "-1.8px",
            color: "var(--fg-1)",
            margin: 0,
          }}
        >
          Stop reading about AI.
          <br />
          <em style={{ fontStyle: "italic", color: "var(--fg-1)" }}>Start shipping it.</em>
        </h2>
        <p
          className="gsap-reveal"
          style={{
            fontSize: 19,
            color: "var(--fg-2)",
            marginTop: 20,
            maxWidth: 560,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.55,
          }}
        >
          Eight minutes. Eight dimensions. A scorecard your leadership team
          will actually use.
        </p>
        <div
          className="gsap-reveal"
          style={{
            marginTop: 36,
            justifyContent: "center",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })}
            className="hover:scale-105 transition-all duration-200"
            style={{
              padding: "14px 22px",
              fontSize: 15,
              borderRadius: "var(--r-sm)",
              background: "var(--charcoal-ink)",
              color: "#fff",
              boxShadow: "0 1px 0 rgba(255,255,255,0.15) inset, 0 6px 20px rgba(41,40,39,0.18)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            <span>Start Free Assessment</span>
          </button>
          <Link
            href="/pricing"
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
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
