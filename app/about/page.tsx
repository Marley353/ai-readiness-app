import Link from "next/link";
import { TopNav } from "@/components/landing/top-nav";
import { Footer } from "@/components/landing/footer";
import { ArrowRight, BookOpen, Database, Users, Scale, Compass, Rocket } from "lucide-react";

export const metadata = {
  title: "About the framework · AI Readiness",
  description:
    "How the 8-dimension AI readiness framework is built, calibrated and kept honest. Cisco Index data, McKinsey benchmarks, and transparent methodology.",
};

const SOURCES = [
  {
    Icon: Database,
    title: "Cisco AI Readiness Index",
    description:
      "Annual survey of 8,000+ organisations across 30 markets. Defines the 4-tier readiness model (Laggard / Follower / Chaser / Pacesetter) and provides the weighted infrastructure, data and governance baselines we calibrate against.",
  },
  {
    Icon: BookOpen,
    title: "McKinsey State of AI",
    description:
      "Longitudinal research on AI adoption, skills gaps and ROI realisation. Informs our scoring of capability, culture and value-realisation dimensions — and grounds the '46% cite skills as primary barrier' baseline.",
  },
  {
    Icon: Scale,
    title: "EU AI Act & UK AI White Paper",
    description:
      "Regulatory frameworks driving the Ethics & Governance dimension. The scoring model flags compliance-adjacent gaps (data classification, transparency, accountability) before they become enforcement exposure.",
  },
  {
    Icon: Users,
    title: "Oxford Government AI Readiness Index",
    description:
      "Macro-level framework that validates the dimensional balance of our scoring — ensuring we weight capability building alongside infrastructure, not over-indexed on either.",
  },
];

const PRINCIPLES = [
  {
    Icon: Compass,
    title: "Evidence over opinion",
    description:
      "Every dimension weighting is grounded in published research. No invented scores, no invented benchmarks. Sources are cited inline on the report so your board can audit the methodology.",
  },
  {
    Icon: Scale,
    title: "Honest free tier",
    description:
      "The free assessment is genuinely free and genuinely useful. No stripped-down results, no hidden card capture. Pro unlocks depth and adaptivity — not the basic answer.",
  },
  {
    Icon: Rocket,
    title: "Actionable, not academic",
    description:
      "Every score comes with a 90-day action plan specific to your sector and your weakest dimensions. If the assessment doesn't tell you what to do on Monday morning, it's not doing its job.",
  },
];

export default function AboutPage() {
  return (
    <>
      <TopNav />

      {/* Hero */}
      <section
        className="relative overflow-hidden aurora-bg"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(255,183,112,0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(196,102,26,0.25) 0%, transparent 50%), #0a0a0a",
        }}
      >
        <div className="relative z-10 mx-auto max-w-4xl px-6 md:px-10 pt-16 md:pt-24 pb-20 md:pb-24 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/60">About the framework</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.05]">
            Rigorous, evidence-based,{" "}
            <span
              style={{
                color: "#c4661a",
              }}
            >
              auditable.
            </span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/65 max-w-2xl mx-auto leading-relaxed">
            This platform isn't another AI hype site. It's a readiness engine built on Cisco Index data, McKinsey benchmarks and an 8-dimension framework calibrated against real organisational outcomes.
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Methodology</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              How the framework is built
            </h2>
            <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed">
              Every dimension, every weight, every recommendation traces back to published research. The assessment is a synthesis of four primary sources.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {SOURCES.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl p-6 md:p-8 hover-lift bg-white"
                style={{ border: "1px solid #e5e7eb" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                  style={{ background: "#0a0a0a" }}
                >
                  <s.Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section style={{ background: "#fafafa" }} className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">What we stand for</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Three principles we won't compromise
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl p-6 bg-white hover-lift"
                style={{ border: "1px solid #e5e7eb" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
                  style={{ background: "#0a0a0a" }}
                >
                  <p.Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">{p.title}</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency note + CTA */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 md:px-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Transparency</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            You can always see where a score came from.
          </h2>
          <p className="mt-5 text-base md:text-lg text-slate-600 leading-relaxed">
            Every dimension report shows the underlying factors, the weighting logic, and the industry benchmark comparator. If the framework ever changes, we publish the changelog.
          </p>
          <div className="mt-8">
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white bg-[#0a0a0a] hover:opacity-90 transition"
            >
              Take the free assessment
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
