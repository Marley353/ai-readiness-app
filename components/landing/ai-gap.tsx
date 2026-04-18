// "The AI Readiness Gap" — stats-forward section immediately after the hero
// that grounds the product in real research (Cisco Index + McKinsey) and
// gives visitors a "this is serious, this is evidence-based" anchor before
// the feature tour.

const STATS = [
  {
    value: "15%",
    headline: "of organisations have infrastructure ready for AI workloads",
    source: "Cisco AI Readiness Index 2024",
  },
  {
    value: "76% vs 19%",
    headline: "top performers with fully centralised data vs. all organisations",
    source: "Cisco AI Readiness Index 2024",
  },
  {
    value: "46%",
    headline: "of leaders cite skills gaps as their primary AI adoption barrier",
    source: "McKinsey State of AI 2024",
  },
];

export function AiGap() {
  return (
    <section style={{ background: "#fafafa" }} className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">The AI Readiness Gap</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Most organisations are{" "}
            <span className="text-slate-600">experimenting with AI.</span>{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0066ff, #a855f7 50%, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Very few are ready for it.
            </span>
          </h2>
          <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed">
            The research tells a consistent story — the difference between AI pacesetters and everyone else isn't budget or ambition. It's foundational readiness.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.value}
              className="rounded-2xl p-7 bg-white hover-lift"
              style={{ border: "1px solid #e5e7eb" }}
            >
              <p
                className="text-5xl md:text-6xl font-black tracking-tighter leading-none"
                style={{
                  background: "linear-gradient(135deg, #0066ff, #a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {s.value}
              </p>
              <p className="mt-4 text-sm text-slate-700 leading-relaxed font-medium">{s.headline}</p>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">{s.source}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 mx-auto max-w-2xl text-center text-sm text-slate-500 italic leading-relaxed">
          "AI is no longer a future consideration. It's a present-day performance gap — and the organisations that are winning have already built the foundations most are still debating."
        </p>
      </div>
    </section>
  );
}
