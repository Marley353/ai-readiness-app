import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCta() {
  return (
    <section
      className="relative overflow-hidden aurora-bg"
      style={{
        background:
          "radial-gradient(ellipse at 20% 0%, rgba(0,102,255,0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(236,72,153,0.25) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.2) 0%, transparent 60%), #0a0a0a",
      }}
    >
      <div className="relative z-10 mx-auto max-w-3xl px-6 md:px-10 py-24 md:py-32 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase text-white/90 mb-8"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Sparkles className="h-3 w-3" /> Ready when you are
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.02]">
          Know your AI gap.{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #60a5fa, #a855f7 45%, #f472b6 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Close it in 12 months.
          </span>
        </h2>
        <p className="mt-6 text-base md:text-lg text-white/65 max-w-xl mx-auto leading-relaxed">
          Join the leaders getting clarity on AI readiness in under 10 minutes. Start with the free assessment — upgrade when you need benchmarks and the roadmap.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/app"
            className="group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-black bg-white transition hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(255,255,255,0.35)]"
          >
            Start free assessment
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold text-white/85 transition hover:bg-white/5 hover:text-white"
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            See pricing
          </Link>
        </div>
        <p className="mt-5 text-xs text-white/50">
          Free forever tier · 7-day Pro trial · Cancel anytime
        </p>
      </div>
    </section>
  );
}
