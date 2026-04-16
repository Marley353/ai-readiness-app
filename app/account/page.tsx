import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?redirect_url=/account");

  const meta = user.publicMetadata as { plan?: "free" | "pro"; subscriptionStatus?: string } | null;
  const plan = meta?.plan === "pro" ? "pro" : "free";

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#0a0a0a" }}>
      <div className="absolute -top-40 -right-40 w-[32rem] h-[32rem] rounded-full opacity-40 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #0066ff, transparent 60%)" }} />
      <div className="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] rounded-full opacity-30 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #a855f7, transparent 60%)" }} />

      <div className="relative z-10 mx-auto max-w-2xl px-4 pt-6 md:px-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition">
          ← Back to app
        </Link>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 pt-10 md:pt-16 pb-16 md:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-white/60">Account</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-black text-white tracking-tight">{user.firstName || "Hello"}</h1>
        <p className="mt-2 text-sm text-white/60">{user.primaryEmailAddress?.emailAddress}</p>

        {/* Current plan */}
        <div className="mt-8 rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Current plan</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight" style={{ color: plan === "pro" ? undefined : "#fff", background: plan === "pro" ? "linear-gradient(90deg, #818cf8, #ec4899)" : undefined, WebkitBackgroundClip: plan === "pro" ? "text" : undefined, WebkitTextFillColor: plan === "pro" ? "transparent" : undefined }}>
                {plan === "pro" ? "AI Readiness Pro" : "Free"}
              </h2>
              {meta?.subscriptionStatus && plan === "pro" && (
                <p className="mt-1 text-xs text-white/60">Subscription status: <span className="font-semibold capitalize">{meta.subscriptionStatus}</span></p>
              )}
            </div>
            {plan === "free" ? (
              <Link
                href="/pricing"
                className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-black bg-white transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,255,255,0.3)]"
              >
                <Sparkles className="h-3.5 w-3.5" /> Upgrade to Pro <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <a
                href="https://billing.stripe.com/p/login/test_dR6bIO2cpe4Cf3abII"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/90 transition hover:text-white hover:bg-white/5"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                Manage billing
              </a>
            )}
          </div>

          {plan === "pro" && (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                "Industry benchmarks",
                "12-month roadmap",
                "Unlimited assessments",
                "Clean PDF export",
                "Compare mode",
                "Sector recommendations",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#5eead4" }} strokeWidth={2.2} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
