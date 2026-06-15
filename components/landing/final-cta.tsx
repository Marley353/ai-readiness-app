"use client";

import { useScrollReveal } from "@/lib/gsap-hooks";
import { NeuralField } from "./neural-field";
import { CtaButton } from "./cta-button";

export function FinalCta() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.12 });

  return (
    <section
      id="final-cta"
      style={{
        position: "relative",
        padding: "120px 24px",
        overflow: "hidden",
        background: "#050914",
        color: "#fff",
      }}
    >
      {/* Animated neural mesh — cohesive closing moment */}
      <NeuralField colors={["255, 183, 112", "196, 102, 26", "255, 210, 160"]} density={18000} linkDistance={130} style={{ opacity: 0.45 }} />

      {/* Ambient grid */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
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
            color: "#fff",
            margin: 0,
          }}
        >
          Stop debating AI readiness.
          <br />
          <em style={{ fontStyle: "italic" }}>Start measuring it.</em>
        </h2>
        <p
          className="gsap-reveal"
          style={{
            fontSize: 19,
            color: "rgba(255,255,255,0.65)",
            marginTop: 20,
            maxWidth: 560,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.55,
          }}
        >
          6–8 minutes. Eight dimensions. A board-ready scorecard your
          leadership team will actually use.
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
          <CtaButton size="lg">Start Free Assessment</CtaButton>
          <CtaButton href="/pricing" variant="ghost" size="lg">See pricing</CtaButton>
        </div>
      </div>
    </section>
  );
}
