"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRICING } from "@/lib/plans";
import { useScrollReveal } from "@/lib/gsap-hooks";

export function PricingTeaser() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  const savings = Math.round(
    ((PRICING.monthly.amount - PRICING.annual.amount / 12) / PRICING.monthly.amount) * 100,
  );

  const plans = [
    {
      tier: "Scorecard",
      price: "Free",
      sub: "",
      desc: "The 8-dimension assessment and a benchmark against your sector.",
      features: ["32-question scorecard", "Sector benchmark", "Basic PDF report"],
      cta: "Start scorecard",
      href: "/app",
      highlight: false,
    },
    {
      tier: "Pro",
      price: `£${PRICING.monthly.amount}`,
      sub: "/month",
      desc: "Full roadmap, benchmarks on every chart, clean exports and unlimited assessments.",
      features: ["Everything in Free", "12-month roadmap", "Industry benchmarks", "Clean PDF export", "Compare assessments"],
      cta: "Start 7-day trial",
      href: "/pricing",
      highlight: true,
    },
    {
      tier: "Annual",
      price: `£${PRICING.annual.amount}`,
      sub: "/year",
      desc: `Save ${savings}% — everything in Pro, billed annually.`,
      features: ["Everything in Pro", `≈ £${(PRICING.annual.amount / 12).toFixed(0)}/month`, "Priority support", "First access to new features"],
      cta: "Start 7-day trial",
      href: "/pricing",
      highlight: false,
    },
  ];

  return (
    <section
      id="pricing"
      style={{
        position: "relative",
        padding: "120px 24px",
        background: "var(--bg-page-2, #f2ede4)",
      }}
    >
      <div ref={sectionRef} style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <div className="gsap-reveal" style={{ textAlign: "center", maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amethyst-link)", textTransform: "uppercase" as const, letterSpacing: "0.6px", display: "inline-block", marginBottom: 16 }}>
            Pricing
          </span>
          <h2 style={{ fontSize: "clamp(34px, 4.4vw, 56px)", fontWeight: 460, lineHeight: 0.98, letterSpacing: "-1.4px", color: "var(--fg-1)", margin: 0 }}>
            Three ways in. <em style={{ fontStyle: "italic" }}>One outcome.</em>
          </h2>
          <p style={{ fontSize: 19, lineHeight: 1.55, color: "var(--fg-2)", marginTop: 20, marginLeft: "auto", marginRight: "auto" }}>
            Start free with a scorecard. Upgrade to Pro when you need the roadmap and benchmarks.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 56 }} className="pricing-grid">
          {plans.map((p) => (
            <div
              key={p.tier}
              className="gsap-reveal"
              style={{
                background: p.highlight ? "var(--charcoal-ink)" : "var(--pure-white)",
                color: p.highlight ? "var(--white-95)" : "var(--fg-1)",
                border: `1px solid ${p.highlight ? "transparent" : "var(--parchment-border)"}`,
                borderRadius: 16,
                padding: 32,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {p.highlight && (
                <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "var(--amethyst-link)", filter: "blur(100px)", opacity: 0.4, bottom: -120, right: -80 }} />
              )}
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.highlight ? "var(--lavender-glow)" : "var(--amethyst-link)", letterSpacing: "1px", textTransform: "uppercase" as const }}>{p.tier}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 12 }}>
                  <span style={{ fontSize: 48, fontWeight: 540, letterSpacing: "-1.2px", lineHeight: 1 }}>{p.price}</span>
                  {p.sub && <span style={{ fontSize: 14, color: p.highlight ? "rgba(255,255,255,0.6)" : "var(--fg-3)" }}>{p.sub}</span>}
                </div>
                <p style={{ fontSize: 15, fontWeight: 460, lineHeight: 1.5, color: p.highlight ? "rgba(255,255,255,0.75)" : "var(--fg-2)", margin: "12px 0 0" }}>{p.desc}</p>
              </div>
              <div style={{ height: 1, background: p.highlight ? "rgba(255,255,255,0.12)" : "var(--parchment-border)", position: "relative" }} />
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
                {p.features.map((f) => (
                  <li key={f} style={{ fontSize: 14, fontWeight: 460, color: p.highlight ? "rgba(255,255,255,0.85)" : "var(--fg-2)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: p.highlight ? "var(--lavender-glow)" : "var(--amethyst-link)", marginTop: 1 }}>—</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                style={{
                  marginTop: "auto",
                  position: "relative",
                  textAlign: "center",
                  padding: "14px 20px",
                  borderRadius: "var(--r-sm)",
                  fontSize: 15,
                  fontWeight: 600,
                  textDecoration: "none",
                  background: p.highlight ? "var(--lavender-glow)" : "var(--warm-cream)",
                  color: "var(--charcoal-ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {p.cta}
                {p.highlight && <ArrowRight size={14} />}
              </Link>
            </div>
          ))}
        </div>

        <div className="gsap-reveal" style={{ marginTop: 32, textAlign: "center" }}>
          <Link
            href="/pricing"
            style={{ fontSize: 15, fontWeight: 540, color: "var(--amethyst-link)", textDecoration: "underline", textUnderlineOffset: "3px" }}
          >
            See full feature comparison →
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 980px) { .pricing-grid { grid-template-columns: 1fr !important; max-width: 480px; margin-left: auto; margin-right: auto; } }
      `}</style>
    </section>
  );
}
