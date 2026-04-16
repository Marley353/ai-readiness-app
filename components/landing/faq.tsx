"use client";

const ITEMS = [
  {
    q: "How long does the assessment take?",
    a: "Most teams finish in 8-10 minutes. You score 32 factors across 8 dimensions on a simple 1-5 maturity scale — no essays, no homework, no data uploads.",
  },
  {
    q: "What is the framework based on?",
    a: "We synthesise the 8-dimension enterprise framework used by Microsoft, AIMRI and the EU AI Act readiness standards — strategy, people, process, data, technology, ethics, culture and innovation. Weights are calibrated against published AI maturity research.",
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
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 md:px-10">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">FAQ</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Questions, answered.
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl p-5 bg-white open:shadow-sm transition"
              style={{ border: "1px solid #e5e7eb" }}
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{item.q}</h3>
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-slate-600 transition group-open:rotate-45"
                  style={{ background: "#f1f5f9" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          Still have questions?{" "}
          <a href="mailto:support@aireadiness.app" className="font-semibold text-slate-900 hover:text-indigo-600 transition">
            Email us directly
          </a>
          .
        </p>
      </div>
    </section>
  );
}
