"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { TiltCard } from "./tilt-card";

const INDUSTRIES = [
  { key: "General", label: "General" },
  { key: "Retail", label: "Retail" },
  { key: "Facilities Management", label: "FM" },
  { key: "Finance", label: "Finance" },
  { key: "Public Sector", label: "Public Sector" },
];

function getIndustryHook(industry: string): string {
  switch (industry) {
    case "Retail":
      return "Understand how AI can reduce shrink, optimise staffing, and improve store operations.";
    case "Facilities Management":
      return "Identify how AI can optimise site inspections, incident response, and risk visibility.";
    case "Finance":
      return "Strengthen compliance, risk modelling, and operational efficiency with AI.";
    case "Public Sector":
      return "Improve service delivery, governance, and operational transparency using AI.";
    default:
      return "Identify where AI will deliver measurable operational and financial impact.";
  }
}

export function Hero() {
  const [industry, setIndustry] = useState("General");
  // Ambient video only plays for users who haven't asked for reduced motion;
  // everyone else (and the SSR pass) gets the static poster frame.
  const [canAutoplay, setCanAutoplay] = useState(false);

  useEffect(() => {
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setCanAutoplay(true);
    }
  }, []);

  const handleStart = () => {
    if (industry !== "General") localStorage.setItem("ai_industry", industry);
    window.location.href = "/app";
  };

  const handleSampleReport = () => {
    const el = document.getElementById("scorecard-preview");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

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
        background: "radial-gradient(120% 100% at 70% 10%, #0a1530 0%, #050914 45%, #030610 100%)",
      }}
    >
      {/* Cinematic backdrop — static render upgraded to ambient video loop */}
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <img
          src="/hero-bg.jpg"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
        />
        {canAutoplay && (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/hero-bg.jpg"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
          >
            <source src="/hero-loop.mp4" type="video/mp4" />
          </video>
        )}
        {/* scrim keeps the left copy column readable over the moving backdrop */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(5,9,20,0.94) 0%, rgba(5,9,20,0.8) 40%, rgba(5,9,20,0.45) 75%, rgba(5,9,20,0.3) 100%)" }} />
      </div>

      {/* Aurora gradient blobs */}
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />
      <div className="aurora aurora-3" />

      {/* Grid vignette */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(120% 80% at 50% 40%, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(120% 80% at 50% 40%, #000 30%, transparent 75%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div className="hero-grid">
        {/* Left — copy */}
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            <span>Evidence-based · Benchmarked · Board-ready</span>
          </div>

          <h1 className="hero-headline">
            Measure your organisation&apos;s{" "}
            <span className="hero-accent">AI readiness</span> in minutes
          </h1>

          <p className="hero-sub">
            Benchmark across 8 critical dimensions. {getIndustryHook(industry)}
          </p>

          {/* Industry selector */}
          <div className="hero-industry">
            {INDUSTRIES.map((item) => (
              <button
                key={item.key}
                onClick={() => setIndustry(item.key)}
                className={`hero-chip ${industry === item.key ? "active" : ""}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className="hero-ctas">
            <button onClick={handleStart} className="hero-cta-primary">
              Start Free Assessment
              <span style={{ fontSize: 18 }}>→</span>
            </button>
            <button onClick={handleSampleReport} className="hero-cta-secondary">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" />
                <path d="M6.5 5.5l4 2.5-4 2.5z" fill="#fff" />
              </svg>
              View Sample Report
            </button>
          </div>

          <div className="hero-meta">
            <span>Takes 6–8 minutes</span>
            <span className="hero-dot">•</span>
            <span>No sign-up to start</span>
            <span className="hero-dot">•</span>
            <span><strong style={{ color: "#fff" }}>Only 13%</strong> are fully AI-ready</span>
          </div>
        </div>

        {/* Right — floating product shot */}
        <div className="hero-visual">
          <TiltCard max={9} scale={1.03} className="hero-tilt">
            <div className="hero-shot">
              <Image src="/hero-bg.jpg" alt="AI Readiness dashboard preview" width={1536} height={1024} priority style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          </TiltCard>
          {/* floating accent pills */}
          <div className="float-pill pill-a">
            <span className="pill-score">73</span>
            <span className="pill-label">Readiness</span>
          </div>
          <div className="float-pill pill-b">
            <span style={{ color: "#FFA552", fontWeight: 700 }}>£420K+</span>
            <span className="pill-label">Value upside</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-grid {
          position: relative;
          z-index: 2;
          max-width: 1240px;
          width: 100%;
          margin: 0 auto;
          padding: 120px 32px 80px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 56px;
          align-items: center;
        }
        .hero-copy { max-width: 560px; }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 7px 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: rgba(255,255,255,0.7);
          margin-bottom: 26px;
        }
        .hero-badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #FFA552;
          box-shadow: 0 0 12px 2px rgba(255,165,82,0.7);
          animation: pulseDot 2.4s ease-in-out infinite;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .hero-headline {
          font-size: clamp(40px, 5.4vw, 72px);
          font-weight: 560;
          line-height: 1.03;
          letter-spacing: -0.03em;
          margin: 0 0 22px;
          color: #F4F5F7;
        }
        .hero-accent {
          background: linear-gradient(135deg, #FFC178 0%, #FFA552 45%, #FF7A33 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-sub {
          font-size: clamp(16px, 1.7vw, 19px);
          color: rgba(255,255,255,0.62);
          line-height: 1.6;
          margin: 0 0 28px;
          max-width: 460px;
          min-height: 60px;
        }

        .hero-industry {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 30px;
        }
        .hero-chip {
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.12);
          cursor: pointer;
          transition: all 200ms ease;
        }
        .hero-chip:hover { color: #fff; border-color: rgba(255,255,255,0.3); }
        .hero-chip.active {
          background: linear-gradient(135deg, #FFC178, #FF8A3D);
          color: #1a0f04;
          font-weight: 700;
          border-color: transparent;
          box-shadow: 0 4px 20px rgba(255,138,61,0.35);
        }

        .hero-ctas {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }
        .hero-cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 15px 30px;
          font-size: 15px;
          font-weight: 700;
          color: #1a0f04;
          background: linear-gradient(135deg, #FFC178, #FF8A3D);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          box-shadow: 0 8px 30px rgba(255,138,61,0.3);
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .hero-cta-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 14px 40px rgba(255,138,61,0.45);
        }
        .hero-cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 15px 26px;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 14px;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 200ms ease;
        }
        .hero-cta-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.35); }

        .hero-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 13px;
          color: rgba(255,255,255,0.45);
        }
        .hero-dot { opacity: 0.4; }

        /* Visual */
        .hero-visual { position: relative; }
        .hero-tilt { border-radius: 18px; }
        .hero-shot {
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.7), 0 0 60px -10px rgba(110,231,255,0.25);
          animation: floatY 6s ease-in-out infinite;
        }
        .hero-shot img { display: block; width: 100%; height: auto; }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }

        .float-pill {
          position: absolute;
          display: flex;
          flex-direction: column;
          padding: 12px 18px;
          border-radius: 14px;
          background: rgba(10,18,38,0.7);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(14px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        .pill-a { top: 6%; left: -22px; animation: floatY 5s ease-in-out infinite; }
        .pill-b { bottom: 8%; right: -18px; animation: floatY 7s ease-in-out 0.6s infinite; }
        .pill-score { font-size: 26px; font-weight: 800; color: #fff; line-height: 1; }
        .pill-label { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }

        /* Aurora blobs */
        :global(.aurora) {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          pointer-events: none;
          z-index: 1;
        }
        :global(.aurora-1) {
          width: 540px; height: 540px; top: -10%; right: 8%;
          background: radial-gradient(circle, rgba(110,231,255,0.4), transparent 65%);
          animation: drift1 18s ease-in-out infinite;
        }
        :global(.aurora-2) {
          width: 460px; height: 460px; bottom: -12%; left: 4%;
          background: radial-gradient(circle, rgba(167,139,250,0.35), transparent 65%);
          animation: drift2 22s ease-in-out infinite;
        }
        :global(.aurora-3) {
          width: 420px; height: 420px; top: 24%; left: 38%;
          background: radial-gradient(circle, rgba(255,165,82,0.2), transparent 65%);
          animation: drift1 26s ease-in-out infinite reverse;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-40px, 30px); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(50px, -30px); }
        }

        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
            padding-top: 110px;
            gap: 48px;
          }
          .hero-copy { max-width: 100%; margin: 0 auto; }
          .hero-sub { margin-left: auto; margin-right: auto; }
          .hero-industry, .hero-ctas, .hero-meta { justify-content: center; }
          .float-pill { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-shot, .float-pill, .hero-badge-dot, :global(.aurora) { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
