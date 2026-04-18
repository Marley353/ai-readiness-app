import Link from "next/link";
import { ArrowRight, Sparkles, Check } from "lucide-react";

// Hero — dark aurora background with the signature blue→violet→pink gradient
// heading, strict answers to the 3 clarity-test questions (what / who / action),
// primary + secondary CTAs, immediate social proof, and an AI-specific trust
// strip calling out human-control points.
export function Hero() {
  return (
    <section
      className="relative overflow-hidden aurora-bg"
      style={{
        background:
          "radial-gradient(ellipse at 20% 0%, rgba(0,102,255,0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(236,72,153,0.25) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.2) 0%, transparent 60%), #0a0a0a",
      }}
    >
      <div className="relative z-10 mx-auto max-w-5xl px-6 md:px-10 pt-20 md:pt-28 pb-20 md:pb-28 text-center">
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase text-white/90 mb-8 animate-fade-in"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Sparkles className="h-3 w-3" /> 8-Dimension Enterprise Framework
        </div>

        {/* Headline — answers "what it does" */}
        <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-[1.02] animate-slide-up">
          Know exactly where your organisation stands on{" "}
          <span
            className="animate-gradient"
            style={{
              background: "linear-gradient(90deg, #60a5fa, #a855f7 45%, #f472b6 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 200%",
            }}
          >
            AI — and what to do next
          </span>
          .
        </h1>

        {/* Who-it's-for line — answers "who it's for" */}
        <p className="mt-6 text-[11px] md:text-xs font-bold tracking-[0.3em] uppercase text-white/55 animate-fade-in">
          For business leaders · Transformation leads · AI implementers
        </p>

        {/* Subhead — referenced research */}
        <p className="mt-6 text-base md:text-xl text-white/65 max-w-2xl mx-auto leading-relaxed animate-slide-up">
          Find out where you stand in 8 minutes. The AI Readiness Platform grounded in Cisco Index data, McKinsey benchmarks and an 8-dimension framework trusted by transformation leaders.
        </p>

        {/* CTAs — single dominant primary, subordinate secondary */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center animate-slide-up">
          <Link
            href="/app"
            className="group inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-bold text-black bg-white transition hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(255,255,255,0.35)]"
          >
            See your AI readiness score
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:text-white hover:bg-white/5"
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Explore the framework
          </Link>
        </div>

        {/* Trial hint inline with CTAs */}
        <p className="mt-4 text-xs text-white/45 animate-fade-in">
          Free forever tier · <strong className="text-white/70">7-day Pro trial</strong> included · No credit card to start
        </p>

        {/* Adjacent social proof — immediately below CTA, not in separate section */}
        <figure className="mt-10 max-w-xl mx-auto">
          <blockquote className="text-sm md:text-base text-white/75 italic leading-relaxed">
            "The framework gave our leadership team a shared language for something we'd been struggling to align on for 18 months."
          </blockquote>
          <figcaption className="mt-3 text-[11px] font-bold uppercase tracking-widest text-white/45">
            — Head of Digital Transformation, UK Retail
          </figcaption>
        </figure>

        {/* AI trust signals — what AI does, what humans control.
            Unique to AI products; a major conversion barrier if not addressed. */}
        <div
          className="mt-10 max-w-2xl mx-auto rounded-2xl p-5 text-left"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-3">
            How this platform uses AI
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 text-xs text-white/75">
            {[
              "AI helps interpret your responses and benchmark your score",
              "You review and control all recommendations before acting",
              "No data is used to train third-party AI models",
              "Your results are yours — export or delete at any time",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-white/80" strokeWidth={2.5} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust bar — quick-scan credibility */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/45">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-white/30" />
            Built on Cisco data from 8,000+ organisations
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-white/30" />
            Results in 8 minutes
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-white/30" />
            WCAG 2.1 AA accessible
          </div>
        </div>
      </div>
    </section>
  );
}
