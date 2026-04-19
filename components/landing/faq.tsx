"use client";

import { useScrollReveal } from "@/lib/gsap-hooks";

const ITEMS = [
  {
    q: "How long does the assessment take?",
    a: "Most teams finish in 8-10 minutes. You score 32 factors across 8 dimensions on a simple 1-5 maturity scale — no essays, no homework, no data uploads.",
  },
  {
    q: "What is the framework based on?",
    a: "The 8-dimension framework synthesises research from the Cisco AI Readiness Index (8,000+ organisations surveyed), McKinsey's State of AI reporting, the Oxford Government AI Readiness Index and practitioner research across hundreds of organisations. Weights are calibrated against published AI maturity data, not invented.",
  },
  {
    q: "Why does AI governance matter if we're only experimenting?",
    a: "Because \"experimenting\" is how most AI risk enters an organisation — uncontrolled tool adoption, unclear data boundaries, no audit trail. Governance at the experimentation stage is cheaper to retrofit than at production scale, and it's what distinguishes pacesetters from laggards. Our framework treats governance as a foundational dimension, not a compliance afterthought.",
  },
  {
    q: "What does \"responsible AI\" actually mean for us?",
    a: "Responsible AI is the combination of (a) clear accountability for AI-assisted decisions, (b) bias monitoring and fairness checks appropriate to your use case, (c) transparency with users about when AI is involved, and (d) regulatory alignment (UK AI White Paper, EU AI Act). The assessment scores your current state against each of these and tells you where to focus first.",
  },
  {
    q: "How should we think about data privacy with generative AI tools?",
    a: "Treat any prompt sent to a third-party LLM as potentially exposed. Before employees use public generative AI, you need: clear policy on what data can and can't be shared, vetted enterprise-tier alternatives (Azure OpenAI, AWS Bedrock, or self-hosted) for sensitive data, and a way to audit usage. The Governance, Risk & Ethics dimension of the assessment captures exactly these controls.",
  },
  {
    q: "How often should we reassess?",
    a: "Quarterly is the sweet spot. AI readiness moves faster than most organisational capabilities — a dimension can shift a full tier in 90 days if leadership invests behind a specific gap. Pro users get a visible delta view between assessments so you can track what actually moved.",
  },
  {
    q: "Is my data secure? Where is it stored?",
    a: "Your assessment answers are stored locally in your browser (localStorage) — they never leave your device unless you choose to export a PDF or send an email. Only your Clerk account info (email, name) is stored on our servers. We never sell or share your data.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes. You can cancel any time from your account page. Your Pro access continues through the end of the current billing period — no claw-backs, no hidden fees. During your 7-day free trial, cancelling means you're never charged.",
  },
  {
    q: "What happens when my 7-day trial ends?",
    a: "On day 8, your card is charged the plan you selected (monthly or annual) and Pro features continue seamlessly. Cancel before day 8 and you're never charged. We send a reminder email 48 hours before the trial ends.",
  },
  {
    q: "Do you offer team or enterprise plans?",
    a: "Right now we offer single-seat Pro. Team and enterprise plans with SSO, shared assessments and role-based access are on the roadmap — reach out if you need this today and we'll prioritise.",
  },
];

export function Faq() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.06 });

  return (
    <section className="bg-white py-20 md:py-28">
      <div ref={sectionRef} className="mx-auto max-w-3xl px-6 md:px-10">
        <div className="text-center gsap-reveal">
          <p
            className="text-[11px] uppercase tracking-[0.25em]"
            style={{ fontWeight: 600, color: "var(--fg-3)" }}
          >
            FAQ
          </p>
          <h2
            className="mt-3 text-3xl md:text-5xl tracking-tight leading-tight"
            style={{ fontWeight: 700, color: "var(--fg-1)" }}
          >
            Questions, answered.
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {ITEMS.map((item) => (
            <details
              key={item.q}
              className="gsap-reveal group bg-white open:shadow-sm transition"
              style={{
                borderRadius: "var(--r-lg)",
                padding: "1.25rem",
                border: "1px solid var(--parchment-border)",
              }}
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                <h3
                  className="text-base tracking-tight"
                  style={{ fontWeight: 600, color: "var(--fg-1)" }}
                >
                  {item.q}
                </h3>
                <span
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center transition group-open:rotate-45"
                  style={{
                    borderRadius: "var(--r-sm)",
                    background: "var(--bg-subtle)",
                    color: "var(--fg-2)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p
                className="mt-4 text-sm leading-relaxed"
                style={{ fontWeight: 460, color: "var(--fg-2)" }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <p
          className="gsap-reveal mt-10 text-center text-sm"
          style={{ fontWeight: 460, color: "var(--fg-3)" }}
        >
          Still have questions?{" "}
          <a
            href="mailto:support@aireadiness.app"
            className="transition"
            style={{ fontWeight: 600, color: "var(--amethyst-link)" }}
          >
            Email us directly
          </a>
          .
        </p>
      </div>
    </section>
  );
}
