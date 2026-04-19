"use client";

import { Compass, Users, Workflow, Database, Cpu, Scale, Heart, Rocket, type LucideIcon } from "lucide-react";
import { useScrollReveal } from "@/lib/gsap-hooks";

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
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.08 });

  return (
    <section className="bg-white py-20 md:py-28">
      <div ref={sectionRef} className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto gsap-reveal">
          <p
            className="text-[11px] uppercase tracking-[0.25em]"
            style={{ fontWeight: 600, color: "var(--fg-3)" }}
          >
            The framework
          </p>
          <h2
            className="mt-3 text-3xl md:text-5xl tracking-tight leading-tight"
            style={{ fontWeight: 700, color: "var(--fg-1)" }}
          >
            Eight dimensions.{" "}
            <em style={{ color: "var(--amethyst-link)", fontStyle: "normal" }}>
              One unified view.
            </em>
          </h2>
          <p
            className="mt-5 text-base md:text-lg leading-relaxed"
            style={{ fontWeight: 460, color: "var(--fg-2)" }}
          >
            Every dimension is scored against weighted factors and benchmarked against your sector. Aligned with the frameworks enterprise leaders actually use.
          </p>
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DIMENSIONS.map((d) => (
            <div
              key={d.title}
              className="gsap-reveal transition glow-hover bg-white"
              style={{
                borderRadius: "var(--r-lg)",
                padding: "1.5rem",
                border: "1px solid var(--parchment-border)",
              }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center mb-4"
                style={{
                  borderRadius: "var(--r-sm)",
                  background: "var(--mysteria-purple)",
                }}
              >
                <d.Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
              </div>
              <h3
                className="text-base tracking-tight"
                style={{ fontWeight: 700, color: "var(--fg-1)" }}
              >
                {d.title}
              </h3>
              <p
                className="mt-1.5 text-sm leading-relaxed"
                style={{ fontWeight: 460, color: "var(--fg-2)" }}
              >
                {d.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
