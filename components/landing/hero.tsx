import Link from "next/link";
import { ArrowRight, Sparkles, Star } from "lucide-react";

// Hero — dark aurora background with the signature blue→violet→pink gradient
// heading and a single prominent "Start 7-day free trial" CTA.
export function Hero() {
  return (
    <section
      className="relative overflow-hidden aurora-bg"
      style={{
        background:
          "radial-gradient(ellipse at 20% 0%, rgba(0,102,255,0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(236,72,153,0.25) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.2) 0%, transparent 60%), #0a0a0a",
      }}
    >
      <div className="relative z-10 mx-auto max-w-5xl px-6 md:px-10 pt-20 md:pt-28 pb-24 md:pb-32 text-center">
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

        {/* Headline */}
        <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-[1.02] animate-slide-up">
          Assess your AI readiness{" "}
          <span
            className="animate-gradient"
            style={{
              background: "linear-gradient(90deg, #60a5fa, #a855f7 45%, #f472b6 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 200%",
            }}
          >
            like a Fortune 500 leader
          </span>
          .
        </h1>

        {/* Subhead */}
        <p className="mt-7 text-base md:text-xl text-white/65 max-w-2xl mx-auto leading-relaxed animate-slide-up">
          A professional 8-dimension framework with industry benchmarks, weighted scoring and an actionable 12-month roadmap — all in one beautifully designed tool.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center animate-slide-up">
          <Link
            href="/app"
            className="group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-black bg-white transition hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(255,255,255,0.35)]"
          >
            Start free assessment
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white/85 transition hover:bg-white/5 hover:text-white"
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            See how it works
          </Link>
        </div>

        {/* Trial hint */}
        <p className="mt-5 text-xs text-white/50 animate-fade-in">
          Free forever tier · <strong className="text-white/80">7-day Pro trial</strong> included · No credit card to start
        </p>

        {/* Trust bar */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/45">
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-300" fill="currentColor" />
            <span>Aligned with Microsoft, AIMRI & EU AI Act</span>
          </div>
          <div className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
          <div>32 weighted factors across 8 dimensions</div>
          <div className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
          <div>Boardroom-ready PDF in one click</div>
        </div>
      </div>
    </section>
  );
}
