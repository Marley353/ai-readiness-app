"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Check, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import { PRICING } from "@/lib/plans";

type Interval = "monthly" | "annual";

// Three pricing tiers displayed side-by-side, IONOS-inspired.
// The middle card ("Annual") is the dark bestseller with the gradient banner.
export default function PricingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<Interval | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (interval: Interval) => {
    setError(null);
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=${encodeURIComponent("/pricing")}`);
      return;
    }
    setLoading(interval);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(null);
    }
  };

  // Annual price × 12 / monthly price to derive % saved — defined in one place
  const monthlyEquivalentOfAnnual = PRICING.annual.amount / 12;
  const savingsPercent = Math.round(
    ((PRICING.monthly.amount - monthlyEquivalentOfAnnual) / PRICING.monthly.amount) * 100,
  );
  const annualIfPaidMonthly = PRICING.monthly.amount * 12; // for strike-through

  const ALWAYS_INCLUDED = [
    "8-dimension assessment",
    "Overall readiness score",
    "Radar chart visualisation",
    "Board-ready exports",
    "Sector-specific insight",
  ];

  const FREE_EXTRAS = [
    "One saved assessment",
    "Basic PDF (watermarked)",
  ];

  const PRO_EXTRAS = [
    "Industry benchmarks on every chart",
    "12-month phased maturity roadmap",
    "Side-by-side comparison mode",
    "Unlimited saved assessments",
    "Clean PDF (no watermark)",
    "Strategic sector recommendations",
    "Email sharing & team handoff",
  ];

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      {/* Dark navy hero — matches IONOS' pattern of dark top + light content */}
      <header className="relative overflow-hidden" style={{ background: "#0a0a0a" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[24rem] rounded-full opacity-30 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #cbb7fb, transparent 60%)" }} />
        <div className="absolute bottom-0 right-0 w-[24rem] h-[20rem] rounded-full opacity-20 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #714cb6, transparent 60%)" }} />

        <div className="relative mx-auto max-w-6xl px-6 md:px-10 py-5 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white">
            <span className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black" style={{ background: "#714cb6" }}>AI</span>
            AI Readiness
          </Link>
          <Link href="/app" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition">
            ← Back to app
          </Link>
        </div>

        <div className="relative mx-auto max-w-3xl px-6 pt-6 pb-20 md:pt-12 md:pb-24 text-center md:px-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.25em] uppercase text-white/80 mb-6" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
            Packages & pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.05]">
            Simple pricing for{" "}
            <span style={{ color: "#714cb6",  }}>every stage</span>.
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            Start free. Upgrade to Pro when you need industry benchmarks, the roadmap, comparison mode and clean exports.
          </p>
        </div>
      </header>

      {/* Cards section — pulled up to overlap the hero slightly (IONOS pattern) */}
      <main className="relative mx-auto max-w-6xl px-4 md:px-8 pb-20" style={{ marginTop: "-4rem" }}>
        {/* Always-included strip (floats above the cards on a white rounded pill) */}
        <div className="rounded-2xl bg-white p-5 md:p-6 mb-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)]" style={{ border: "1px solid #e5e7eb" }}>
          <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-4">
            <p className="text-sm font-black text-slate-900 md:whitespace-nowrap">Always included:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2 flex-1">
              {ALWAYS_INCLUDED.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5" style={{ background: "#0a0a0a" }}>
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pricing cards — 3 across on large, stacks on mobile */}
        <div className="grid gap-5 md:grid-cols-3">
          {/* FREE */}
          <article className="relative rounded-2xl bg-white p-8 flex flex-col shadow-[0_4px_24px_rgba(15,23,42,0.06)] hover-lift" style={{ border: "1px solid #e5e7eb" }}>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Free</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed min-h-[48px]">
              Try it out and run your first readiness check.
            </p>

            <div className="mt-6 min-h-[112px] flex flex-col justify-end">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-slate-900 tracking-tighter">£0</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">No extra costs · forever</p>
            </div>

            <Link
              href="/app"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition hover:scale-[1.01]"
              style={{ background: "#0a0a0a", color: "#fff" }}
            >
              Try for free
            </Link>

            <ul className="mt-8 space-y-2.5">
              {FREE_EXTRAS.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-900" strokeWidth={2.4} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </article>

          {/* PRO MONTHLY */}
          <article className="relative rounded-2xl bg-white p-8 flex flex-col shadow-[0_4px_24px_rgba(15,23,42,0.06)] hover-lift" style={{ border: "1px solid #e5e7eb" }}>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pro Monthly</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed min-h-[48px]">
              Flexible month-to-month. Cancel anytime.
            </p>

            <div className="mt-6 min-h-[112px] flex flex-col justify-end">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-slate-900 tracking-tighter">£{PRICING.monthly.amount}</span>
                <span className="text-sm font-bold text-slate-500">/month</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">Billed monthly · excl. VAT</p>
            </div>

            <button
              onClick={() => handleUpgrade("monthly")}
              disabled={loading !== null}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#0a0a0a", color: "#fff" }}
            >
              {loading === "monthly" ? "Starting checkout..." : "Add to basket"}
            </button>

            <ul className="mt-8 space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-slate-900 font-semibold">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-900" strokeWidth={2.4} />
                <span>Everything in Free</span>
              </li>
              {PRO_EXTRAS.slice(0, 5).map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-900" strokeWidth={2.4} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </article>

          {/* PRO ANNUAL — bestseller dark card */}
          <article className="relative rounded-2xl p-8 flex flex-col shadow-[0_12px_48px_rgba(15,23,42,0.2)] hover-lift overflow-hidden" style={{ background: "#0a0a0a", border: "1px solid #222" }}>
            {/* Bestseller banner */}
            <div className="absolute top-0 left-0 right-0 py-2 text-center">
              <div className="inline-flex items-center justify-center gap-1 w-full py-1.5 text-[10px] font-bold tracking-[0.3em] text-white" style={{ background: "#cbb7fb" }}>
                <Sparkles className="h-3 w-3" /> BESTSELLER
              </div>
            </div>

            <div className="pt-6">
              <h3 className="text-2xl font-black text-white tracking-tight">Pro Annual</h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed min-h-[48px]">
                Best value. Includes everything in Pro.
              </p>
            </div>

            <div className="mt-6 min-h-[112px] flex flex-col justify-end">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: "#f59e0b", color: "#000" }}>
                  Save {savingsPercent}%
                </span>
                <span className="text-sm text-white/40 line-through font-semibold">£{annualIfPaidMonthly}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-white tracking-tighter">£{PRICING.annual.amount}</span>
                <span className="text-sm font-bold text-white/50">/year</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-white/60">
                ≈ £{monthlyEquivalentOfAnnual.toFixed(2)}/month · billed annually
              </p>
            </div>

            <button
              onClick={() => handleUpgrade("annual")}
              disabled={loading !== null}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(255,255,255,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#fff", color: "#000" }}
            >
              {loading === "annual" ? "Starting checkout..." : "Add to basket"}
              {loading !== "annual" && <ArrowRight className="h-4 w-4" />}
            </button>

            <ul className="mt-8 space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-white font-semibold">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-white" strokeWidth={2.4} />
                <span>Everything in Pro Monthly</span>
              </li>
              {PRO_EXTRAS.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/85">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-white" strokeWidth={2.4} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-6 mx-auto max-w-md rounded-xl p-4 flex items-start gap-2" style={{ background: "#fff1f2", border: "1px solid #fecdd3" }}>
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-700" />
            <p className="text-sm text-rose-900">{error}</p>
          </div>
        )}

        {/* Reassurance footer */}
        <div className="mt-16 grid gap-6 md:grid-cols-3 text-center">
          {[
            { title: "Cancel anytime", text: "No lock-in. Your subscription runs to the end of the paid period." },
            { title: "VAT-compliant", text: "UK & EU VAT handled automatically at checkout." },
            { title: "Secure payments", text: "Cards processed by Stripe. PCI-DSS compliant." },
          ].map((item) => (
            <div key={item.title}>
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">{item.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
