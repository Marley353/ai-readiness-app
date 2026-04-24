"use client";

import { useState } from "react";
import { useScrollReveal } from "@/lib/gsap-hooks";

const ITEMS = [
  { q: "How long does the assessment take?", a: "Most teams finish in 6–8 minutes. You score 32 factors across 8 dimensions on a simple 1–5 maturity scale — no essays, no homework, no data uploads." },
  { q: "What is the framework based on?", a: "The 8-dimension framework synthesises research from the Cisco AI Readiness Index (8,000+ organisations surveyed), McKinsey's State of AI reporting, the Oxford Government AI Readiness Index and practitioner research across hundreds of organisations. Weights are calibrated against published AI maturity data, not invented." },
  { q: "Why does AI governance matter if we're only experimenting?", a: "Because \"experimenting\" is how most AI risk enters an organisation — uncontrolled tool adoption, unclear data boundaries, no audit trail. Governance at the experimentation stage is cheaper to retrofit than at production scale, and it's what distinguishes pacesetters from laggards." },
  { q: "What does \"responsible AI\" actually mean for us?", a: "Responsible AI is the combination of (a) clear accountability for AI-assisted decisions, (b) bias monitoring and fairness checks appropriate to your use case, (c) transparency with users about when AI is involved, and (d) regulatory alignment (UK AI White Paper, EU AI Act). The assessment scores your current state against each of these." },
  { q: "How should we think about data privacy with generative AI tools?", a: "Treat any prompt sent to a third-party LLM as potentially exposed. Before employees use public generative AI, you need: clear policy on what data can and can't be shared, vetted enterprise-tier alternatives for sensitive data, and a way to audit usage." },
  { q: "How often should we reassess?", a: "Quarterly is the sweet spot. AI readiness moves faster than most organisational capabilities — a dimension can shift a full tier in 90 days if leadership invests behind a specific gap. Pro users get a visible delta view between assessments." },
  { q: "Is my data secure?", a: "Your assessment answers are stored locally in your browser — they never leave your device unless you choose to export a PDF or send an email. Only your account info (email, name) is stored on our servers. We never sell or share your data." },
  { q: "Can I cancel my subscription anytime?", a: "Yes. Cancel any time from your account page. Your Pro access continues through the end of the current billing period. During your 7-day free trial, cancelling means you're never charged." },
  { q: "What's the catch with the free scorecard?", a: "No catch. It's a genuine diagnostic — we'd rather you use it and decide you don't need Pro than use a lead magnet that wastes your time." },
];

export function Faq() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.06 });
  const [open, setOpen] = useState(0);

  return (
    <section
      id="faq"
      style={{
        position: "relative",
        padding: "120px 24px",
        background: "var(--bg-page-2, #f2ede4)",
      }}
    >
      <div
        ref={sectionRef}
        style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}
      >
        <div className="gsap-reveal">
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--amethyst-link)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.6px",
              display: "inline-block",
              marginBottom: 16,
            }}
          >
            FAQ
          </span>
          <h2
            style={{
              fontSize: "clamp(34px, 4.4vw, 56px)",
              fontWeight: 460,
              lineHeight: 0.98,
              letterSpacing: "-1.4px",
              maxWidth: 820,
              color: "var(--fg-1)",
              margin: 0,
            }}
          >
            Answers to what you're actually asking.
          </h2>
        </div>

        <div
          className="gsap-reveal"
          style={{
            marginTop: 48,
            borderTop: "1px solid var(--parchment-border)",
          }}
        >
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                style={{
                  borderBottom: "1px solid var(--parchment-border)",
                  padding: "24px 0",
                  cursor: "pointer",
                }}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 18,
                    fontWeight: 540,
                    color: "var(--fg-1)",
                    letterSpacing: "-0.3px",
                    gap: 24,
                  }}
                >
                  <span>{item.q}</span>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    style={{
                      flexShrink: 0,
                      transition: "transform 300ms cubic-bezier(0.22, 0.61, 0.36, 1)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      color: isOpen ? "var(--amethyst-link)" : "var(--fg-3)",
                    }}
                  >
                    <path d="M6 9L11 14L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div
                  style={{
                    maxHeight: isOpen ? 300 : 0,
                    overflow: "hidden",
                    transition: "max-height 400ms cubic-bezier(0.22, 0.61, 0.36, 1), margin 300ms ease, opacity 300ms ease",
                    opacity: isOpen ? 1 : 0,
                    marginTop: isOpen ? 14 : 0,
                    fontSize: 15.5,
                    lineHeight: 1.6,
                    color: "var(--fg-2)",
                  }}
                >
                  {item.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
