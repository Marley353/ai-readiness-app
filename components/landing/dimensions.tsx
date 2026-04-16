import { Compass, Users, Workflow, Database, Cpu, Scale, Heart, Rocket, type LucideIcon } from "lucide-react";

const DIMENSIONS: { Icon: LucideIcon; title: string; description: string }[] = [
  {
    Icon: Compass,
    title: "Strategy & Leadership",
    description: "Executive sponsorship, vision clarity and measurable AI outcomes.",
  },
  {
    Icon: Users,
    title: "People & Capability",
    description: "Workforce readiness, skills access, change appetite and champions.",
  },
  {
    Icon: Workflow,
    title: "Process & Operations",
    description: "Workflow standardisation, automation potential and delivery maturity.",
  },
  {
    Icon: Database,
    title: "Data & Insight",
    description: "Quality, accessibility, governance and structure of your data foundations.",
  },
  {
    Icon: Cpu,
    title: "Technology & Integration",
    description: "Platform fit, API capability, security posture and scaling pathways.",
  },
  {
    Icon: Scale,
    title: "Ethics & Governance",
    description: "Responsible AI policies, bias monitoring and regulatory compliance readiness.",
  },
  {
    Icon: Heart,
    title: "Culture & Change",
    description: "Innovation culture, cross-functional collaboration and change management.",
  },
  {
    Icon: Rocket,
    title: "Innovation & Experimentation",
    description: "Pilot infrastructure, learning loops and scaling pathways for AI initiatives.",
  },
];

export function DimensionsGrid() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">The framework</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Eight dimensions.{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0066ff, #a855f7 50%, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              One unified view.
            </span>
          </h2>
          <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed">
            Every dimension is scored against weighted factors and benchmarked against your sector. Aligned with the frameworks enterprise leaders actually use.
          </p>
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DIMENSIONS.map((d) => (
            <div
              key={d.title}
              className="rounded-2xl p-6 transition hover-lift bg-white"
              style={{ border: "1px solid #e5e7eb" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "#0a0a0a" }}
              >
                <d.Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
              </div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">{d.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{d.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
