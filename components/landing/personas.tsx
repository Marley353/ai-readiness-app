import { Briefcase, LayoutGrid, Building2 } from "lucide-react";

const PERSONAS = [
  {
    Icon: Briefcase,
    title: "Consultants",
    headline: "Deliver faster, defensible readiness reports.",
    description:
      "Ship boardroom-ready assessments to clients in hours, not weeks. The 8-dimension framework gives you a consistent, credible baseline across every engagement.",
  },
  {
    Icon: LayoutGrid,
    title: "Transformation leaders",
    headline: "See the full map before you commit investment.",
    description:
      "Stop making AI roadmap decisions in the dark. Benchmark against your sector, identify genuine priority gaps and build a 12-month plan the exec team will actually back.",
  },
  {
    Icon: Building2,
    title: "Boards & Execs",
    headline: "A single score the whole C-suite can rally behind.",
    description:
      "Cut through the AI noise with a weighted, sector-aware maturity score. Get the strategic narrative your chair needs and the risk view your CFO will trust.",
  },
];

export function Personas() {
  return (
    <section style={{ background: "#fafafa" }} className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Who it's for</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Built for the people{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0066ff, #a855f7 50%, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              driving AI decisions.
            </span>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PERSONAS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl p-8 bg-white hover-lift"
              style={{ border: "1px solid #e5e7eb" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                style={{ background: "#0a0a0a" }}
              >
                <p.Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{p.title}</p>
              <h3 className="mt-2 text-xl font-black text-slate-900 tracking-tight leading-snug">{p.headline}</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
