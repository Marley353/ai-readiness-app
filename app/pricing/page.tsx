"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CheckCircle2, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import { FREE_FEATURES, PRO_FEATURES, PRICING } from "@/lib/plans";

type Interval = "monthly" | "annual";

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [interval, setInterval] = useState<Interval>("annual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setError(null);
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push(`/sign-up?redirect_url=${encodeURIComponent("/pricing")}`);
      return;
    }
    setLoading(true);
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
      setLoading(false);
    }
  };

  const selected = PRICING[interval];
  const monthlyEquivalent = interval === "annual" ? (PRICING.annual.amount / 12).toFixed(2) : null;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#0a0a0a" }}>
      {/* Aurora accents */}
      <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] rounded-full opacity-40 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #0066ff, transparent 60%)" }} />
      <div className="absolute top-1/2 -left-40 w-[40rem] h-[40rem] rounded-full opacity-30 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #a855f7, transparent 60%)" }} />
      <div className="absolute -bottom-40 right-1/4 w-[32rem] h-[32rem] rounded-full opacity-30 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #ec4899, transparent 60%)" }} />

      {/* Back link */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-6 md:px-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition">
          ← Back to app
        </Link>
      </div>

      {/* Hero */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-10 md:pt-16 pb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white/90 mb-5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
          <Sparkles className="h-3 w-3" /> PRICING
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.05]">
          Boardroom-ready AI readiness <span style={{ background: "linear-gradient(90deg, #0066ff, #a855f7 45%, #ec4899 90%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>in minutes</span>.
        </h1>
        <p className="mt-5 text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
          Start free with the 8-dimension assessment. Upgrade when you need benchmarks, the 12-month roadmap, comparison mode and clean exports.
        </p>

        {/* Interval toggle */}
        <div className="mt-8 inline-flex items-center gap-1 rounded-full p-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={() => setInterval("monthly")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${interval === "monthly" ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("annual")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${interval === "annual" ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
          >
            Annual <span className="ml-1 text-[10px] font-bold" style={{ color: interval === "annual" ? "#065f46" : "#10b981" }}>−35%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-16 md:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-3xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Free</p>
            <h2 className="mt-2 text-2xl font-black text-white tracking-tight">Get started</h2>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-5xl font-black text-white tracking-tight">£0</span>
              <span className="text-sm text-white/50">/ forever</span>
            </div>
            <p className="mt-2 text-sm text-white/60">Everything you need to run your first AI readiness check.</p>

            <Link
              href="/"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white/90 transition hover:text-white hover:bg-white/5"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Continue free
            </Link>

            <ul className="mt-7 space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/50" strokeWidth={2.2} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="relative rounded-3xl p-8" style={{ background: "linear-gradient(140deg, rgba(0,102,255,0.12), rgba(168,85,247,0.08) 60%, rgba(236,72,153,0.12))", border: "1px solid rgba(255,255,255,0.18)" }}>
            <div className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider text-black" style={{ background: "#fff" }}>
              <Sparkles className="h-3 w-3" /> MOST POPULAR
            </div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ background: "linear-gradient(90deg, #818cf8, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pro</p>
            <h2 className="mt-2 text-2xl font-black text-white tracking-tight">AI Readiness Pro</h2>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-5xl font-black text-white tracking-tight">£{selected.amount}</span>
              <span className="text-sm text-white/50">/ {selected.interval}</span>
            </div>
            {monthlyEquivalent && (
              <p className="mt-1 text-xs text-white/60">≈ £{monthlyEquivalent}/month · billed annually</p>
            )}
            <p className="mt-2 text-sm text-white/70">{selected.strapline}</p>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-black bg-white transition hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(255,255,255,0.35)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Starting checkout..." : isSignedIn ? "Upgrade to Pro" : "Sign up & upgrade"}
              {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            </button>

            {error && (
              <div className="mt-3 rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)" }}>
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
                <p className="text-xs text-rose-200">{error}</p>
              </div>
            )}

            <ul className="mt-7 space-y-2.5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/90">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#5eead4" }} strokeWidth={2.2} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          Prices in GBP. VAT added where applicable. Cancel anytime from your account.
        </p>
      </div>
    </div>
  );
}
