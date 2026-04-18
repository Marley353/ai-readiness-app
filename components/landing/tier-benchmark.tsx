import Link from "next/link";
import { ArrowRight } from "lucide-react";

// "Where does your organisation fit?" — the 4-tier Cisco readiness model.
// Horizontal visual ladder with Pacesetter (13%) highlighted as the goal.

const TIERS = [
  {
    name: "Laggard",
    percent: "1%",
    description: "No strategy. No infrastructure. AI is someone else's problem.",
    intensity: 10,
  },
  {
    name: "Follower",
    percent: "~35%",
    description: "Experimenting. No systematic approach. Pilots rarely reach production.",
    intensity: 30,
  },
  {
    name: "Chaser",
    percent: "~51%",
    description: "Active pilots and some structure. Scaling is where the wheels come off.",
    intensity: 60,
  },
  {
    name: "Pacesetter",
    percent: "13%",
    description: "Systematic. Scaling. Seeing measurable value. The destination.",
    intensity: 100,
    highlighted: true,
  },
];

export function TierBenchmark() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">The benchmark</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Where does your organisation{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0066ff, #a855f7 50%, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              actually fit?
            </span>
          </h2>
          <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed">
            Cisco's research across 8,000+ organisations identifies four distinct readiness tiers. Only 13% are Pacesetters — and the gap between them and everyone else is closing faster than most realise.
          </p>
        </div>

        {/* Ladder visual — four columns with increasing "readiness bar" */}
        <div className="mt-14 grid gap-4 md:grid-cols-4">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className="rounded-2xl p-6 hover-lift"
              style={{
                background: tier.highlighted
                  ? "linear-gradient(160deg, rgba(0,102,255,0.06), rgba(168,85,247,0.04) 60%, rgba(236,72,153,0.06)), #0a0a0a"
                  : "#fafafa",
                border: tier.highlighted ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e5e7eb",
                color: tier.highlighted ? "#fff" : undefined,
              }}
            >
              {/* Intensity bar */}
              <div
                className="h-1 rounded-full mb-5 overflow-hidden"
                style={{ background: tier.highlighted ? "rgba(255,255,255,0.08)" : "#e5e7eb" }}
              >
                <div
                  className="h-full rounded-full progress-fill"
                  style={{
                    width: `${tier.intensity}%`,
                    background: tier.highlighted
                      ? "linear-gradient(90deg, #60a5fa, #ec4899)"
                      : "linear-gradient(90deg, #64748b, #334155)",
                  }}
                />
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <h3
                  className={`text-xl font-black tracking-tight ${
                    tier.highlighted ? "text-white" : "text-slate-900"
                  }`}
                >
                  {tier.name}
                </h3>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    tier.highlighted ? "text-white/80" : "text-slate-500"
                  }`}
                >
                  {tier.percent}
                </span>
              </div>

              <p
                className={`mt-3 text-sm leading-relaxed ${
                  tier.highlighted ? "text-white/75" : "text-slate-600"
                }`}
              >
                {tier.description}
              </p>
            </div>
          ))}
        </div>

        {/* Pull-quote / stat callout */}
        <div
          className="mt-10 rounded-2xl p-6 md:p-8 text-center"
          style={{ background: "#fafafa", border: "1px solid #e5e7eb" }}
        >
          <p className="text-base md:text-lg text-slate-800 font-medium leading-relaxed max-w-3xl mx-auto">
            Pacesetters are{" "}
            <span
              className="font-black"
              style={{
                background: "linear-gradient(90deg, #0066ff, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              4× more likely to move AI pilots into production
            </span>{" "}
            and{" "}
            <span
              className="font-black"
              style={{
                background: "linear-gradient(90deg, #0066ff, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              50% more likely to report measurable value
            </span>
            .
          </p>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Cisco AI Readiness Index 2024
          </p>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-black bg-white transition hover:scale-[1.02]"
            style={{ border: "1px solid #0a0a0a", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
          >
            Find out which tier you're in
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
