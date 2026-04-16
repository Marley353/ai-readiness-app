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
  const showMostPopular = interval === "annual";

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#0a0a0a" }}>
      {/* Subtle aurora — quieter than before so the cards carry the eye */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[48rem] h-[28rem] rounded-full opacity-25 blur-[140px] pointer-events-none" style={{ background: "radial-gradient(circle, #0066ff, transparent 70%)" }} />
      <div className="absolute bottom-0 left-1/4 w-[32rem] h-[24rem] rounded-full opacity-20 blur-[140px] pointer-events-none" style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)" }} />

      {/* Back link */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-6 md:px-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition">
          ← Back to app
        </Link>
      </div>

      {/* Hero */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-12 md:pt-20 pb-10 text-center md:px-10">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-widest uppercase text-white/70 mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          Pricing
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.02]">
          Simple pricing.
          <br />
          <span style={{ background: "linear-gradient(90deg, #0066ff, #a855f7 45%, #ec4899 90%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Powerful insight.</span>
        </h1>
        <p className="mt-6 text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
          Start free. Upgrade when you need industry benchmarks, the 12-month roadmap, comparison mode and clean exports.
        </p>

        {/* Interval toggle */}
        <div className="mt-10 inline-flex items-center gap-1 rounded-full p-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={() => setInterval("monthly")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition ${interval === "monthly" ? "bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.25)]" : "text-white/60 hover:text-white"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("annual")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition inline-flex items-center gap-1.5 ${interval === "annual" ? "bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.25)]" : "text-white/60 hover:text-white"}`}
          >
            Annual
            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: interval === "annual" ? "#10b981" : "rgba(16,185,129,0.15)", color: interval === "annual" ? "#fff" : "#10b981" }}>
              SAVE 35%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-20 md:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-3xl p-8 md:p-10 transition" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Free</p>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Forever</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Get started</h2>
            <p className="mt-2 text-sm text-white/60">Run your first AI readiness check. No card required.</p>
            <div className="mt-8 flex items-baseline gap-1">
              <span className="text-6xl font-black text-white tracking-tighter">£0</span>
            </div>

            <Link
              href="/"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-white/90 transition hover:text-white hover:bg-white/5"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Continue free
            </Link>

            <div className="mt-8 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/50">What's included</p>
              <ul className="space-y-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/40" strokeWidth={2.2} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro */}
          <div className="relative rounded-3xl p-8 md:p-10 transition shadow-[0_8px_40px_rgba(0,102,255,0.1)]" style={{ background: "linear-gradient(160deg, rgba(0,102,255,0.08), rgba(168,85,247,0.04) 50%, rgba(236,72,153,0.08)), rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.15)" }}>
            {showMostPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest text-black shadow-lg" style={{ background: "linear-gradient(90deg, #818cf8, #ec4899)", color: "#fff" }}>
                <Sparkles className="h-3 w-3" /> MOST POPULAR
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ background: "linear-gradient(90deg, #818cf8, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Readiness Pro</p>
              <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">{interval === "annual" ? "Best value" : "Flexible"}</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Everything, unlocked</h2>
            <p className="mt-2 text-sm text-white/60">{selected.strapline}</p>

            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-6xl font-black text-white tracking-tighter">£{selected.amount}</span>
              <span className="text-sm text-white/50">/ {selected.interval}</span>
            </div>
            {monthlyEquivalent && (
              <p className="mt-2 text-xs text-white/60">Just <span className="font-bold text-white">£{monthlyEquivalent}/month</span> · billed annually</p>
            )}

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-black bg-white transition hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(255,255,255,0.35)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Starting checkout..." : isSignedIn ? "Upgrade to Pro" : "Sign up & upgrade"}
              {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            </button>

            {error && (
              <div className="mt-3 rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
                <p className="text-xs text-rose-200">{error}</p>
              </div>
            )}

            <div className="mt-8 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/50">Everything in Free, plus</p>
              <ul className="space-y-3">
                {PRO_FEATURES.filter((f) => !f.startsWith("Everything")).map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#5eead4" }} strokeWidth={2.2} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer reassurance bar */}
        <div className="mt-12 grid gap-6 md:grid-cols-3 text-center">
          {[
            { title: "Cancel anytime", text: "Your subscription ends at the period boundary. No lock-in." },
            { title: "VAT-compliant", text: "UK & EU VAT handled automatically at checkout." },
            { title: "Secure payments", text: "Cards processed by Stripe. PCI-DSS compliant." },
          ].map((item) => (
            <div key={item.title}>
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-white/50 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
