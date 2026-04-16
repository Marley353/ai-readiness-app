import { ClipboardList, TrendingUp, FileDown } from "lucide-react";

const STEPS = [
  {
    n: "01",
    Icon: ClipboardList,
    title: "Answer 32 weighted questions",
    description:
      "Score your organisation across 8 dimensions on a simple 1-5 maturity scale. Most teams complete the assessment in under 10 minutes.",
  },
  {
    n: "02",
    Icon: TrendingUp,
    title: "Get benchmarked against your sector",
    description:
      "See how you compare to industry averages in retail, manufacturing, security, logistics and more. Identify your strongest pillar and priority gaps.",
  },
  {
    n: "03",
    Icon: FileDown,
    title: "Receive an actionable 12-month roadmap",
    description:
      "Auto-generated 3-phase plan (0–90 days · 3–6 months · 6–12 months) tailored to your scores and sector. Board-ready PDF in one click.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" style={{ background: "#fafafa" }} className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">How it works</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            From first click to board deck in{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0066ff, #a855f7 50%, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              under 10 minutes.
            </span>
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative">
              {/* Connecting line (only between cards, not after the last one) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(100%-1rem)] w-8 h-px bg-slate-300" />
              )}

              <div className="rounded-2xl p-8 bg-white h-full hover-lift" style={{ border: "1px solid #e5e7eb" }}>
                <div className="flex items-center gap-4 mb-5">
                  <span
                    className="text-4xl font-black tracking-tighter"
                    style={{
                      background: "linear-gradient(135deg, #0066ff, #ec4899)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {s.n}
                  </span>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: "#0a0a0a" }}
                  >
                    <s.Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{s.title}</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
