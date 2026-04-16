import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { PRICING } from "@/lib/plans";

// Compact pricing strip on the landing page — three condensed columns
// that funnel into the full /pricing page.
export function PricingTeaser() {
  const savings = Math.round(
    ((PRICING.monthly.amount - PRICING.annual.amount / 12) / PRICING.monthly.amount) * 100,
  );

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Pricing</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Start free.{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0066ff, #a855f7 50%, #ec4899)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Upgrade when you need more.
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-600">
            All Pro plans include a <strong className="text-slate-900">7-day free trial</strong>. No charge until day 8. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Free */}
          <article className="rounded-2xl p-7 bg-white" style={{ border: "1px solid #e5e7eb" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Free</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">£0</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">No extra costs · forever</p>
            <Link
              href="/app"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
              style={{ border: "1px solid #cbd5e1" }}
            >
              Try for free
            </Link>
          </article>

          {/* Monthly */}
          <article className="rounded-2xl p-7 bg-white" style={{ border: "1px solid #e5e7eb" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Pro Monthly</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">£{PRICING.monthly.amount}</span>
              <span className="text-sm font-bold text-slate-500">/month</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">7-day free trial · cancel anytime</p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white bg-[#0a0a0a] hover:opacity-90 transition"
            >
              Start free trial
            </Link>
          </article>

          {/* Annual — bestseller */}
          <article
            className="relative rounded-2xl p-7 overflow-hidden"
            style={{
              background:
                "linear-gradient(160deg, rgba(0,102,255,0.08), rgba(168,85,247,0.04) 50%, rgba(236,72,153,0.08)), #0a0a0a",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 py-1 text-center text-[10px] font-bold tracking-[0.3em] text-white"
              style={{ background: "linear-gradient(90deg, #6366f1, #a855f7 50%, #ec4899)" }}
            >
              <Sparkles className="inline h-3 w-3 mr-1" /> BESTSELLER
            </div>
            <div className="pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Pro Annual</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-black text-white tracking-tighter">£{PRICING.annual.amount}</span>
                <span className="text-sm font-bold text-white/50">/year</span>
              </div>
              <p className="mt-2 text-xs text-white/65">
                Save {savings}% · ≈ £{(PRICING.annual.amount / 12).toFixed(2)}/month
              </p>
              <Link
                href="/pricing"
                className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-black bg-white hover:scale-[1.02] transition"
              >
                Start free trial
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </article>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 hover:text-indigo-600 transition"
          >
            See the full feature comparison
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
