import Link from "next/link";
import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Compass,
  Users,
  Workflow,
  Database,
  Cpu,
  Scale,
  Heart,
  Rocket,
  TrendingUp,
  FileText,
  Building2,
  Mail,
  Activity,
  Target,
} from "lucide-react";

const PILLAR_PREVIEW = [
  { Icon: Compass, label: "Strategy & Leadership", color: "#6366f1" },
  { Icon: Users, label: "People & Capability", color: "#3b82f6" },
  { Icon: Workflow, label: "Process & Operations", color: "#06b6d4" },
  { Icon: Database, label: "Data & Insight", color: "#14b8a6" },
  { Icon: Cpu, label: "Technology & Integration", color: "#10b981" },
  { Icon: Scale, label: "Ethics & Governance", color: "#8b5cf6" },
  { Icon: Heart, label: "Culture & Change", color: "#f43f5e" },
  { Icon: Rocket, label: "Innovation & Experimentation", color: "#f59e0b" },
];

const PRO_HIGHLIGHTS = [
  { Icon: TrendingUp, title: "12-month roadmap", desc: "Auto-generated phased plan from your scores." },
  { Icon: Activity, title: "Industry benchmarks", desc: "See how you compare vs. sector average." },
  { Icon: Building2, title: "Compare mode", desc: "Side-by-side comparison of multiple assessments." },
  { Icon: FileText, title: "Clean PDF", desc: "Board-ready export without watermark." },
  { Icon: Mail, title: "Email sharing", desc: "Send reports directly to stakeholders." },
  { Icon: Target, title: "Sector recommendations", desc: "Tailored actions for your industry." },
];

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?redirect_url=/account");

  const meta = user.publicMetadata as { plan?: "free" | "pro"; subscriptionStatus?: string } | null;
  const plan = meta?.plan === "pro" ? "pro" : "free";
  const firstName = user.firstName || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "there";
  const email = user.primaryEmailAddress?.emailAddress;
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#0a0a0a" }}>
      {/* Ambient aurora */}
      <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] rounded-full opacity-30 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #0066ff, transparent 60%)" }} />
      <div className="absolute bottom-0 -left-40 w-[32rem] h-[32rem] rounded-full opacity-20 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #a855f7, transparent 60%)" }} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-6 md:px-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition">
          ← Back to app
        </Link>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-10 md:pt-14 pb-16 md:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar — use Clerk's imageUrl if available, else initials */}
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={firstName}
                width={72}
                height={72}
                className="rounded-full ring-2 ring-white/20 object-cover"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full ring-2 ring-white/20 flex items-center justify-center text-2xl font-black text-white" style={{ background: "linear-gradient(135deg, #0066ff, #a855f7)" }}>
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Welcome</p>
              <h1 className="mt-1 text-3xl md:text-4xl font-black text-white tracking-tight">{firstName}</h1>
              <p className="mt-1 text-sm text-white/60">{email} · member since {memberSince}</p>
            </div>
          </div>
          {plan === "free" && (
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-black bg-white transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,255,255,0.3)]"
            >
              <Sparkles className="h-4 w-4" /> Upgrade to Pro
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        {/* Current plan card */}
        <div className="mt-10 rounded-3xl p-6 md:p-8" style={{ background: plan === "pro" ? "linear-gradient(140deg, rgba(0,102,255,0.12), rgba(168,85,247,0.08) 50%, rgba(236,72,153,0.12)), rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)", border: plan === "pro" ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">Current plan</p>
              <h2 className={`mt-2 text-3xl font-black tracking-tight ${plan === "pro" ? "" : "text-white"}`} style={plan === "pro" ? { background: "linear-gradient(90deg, #818cf8, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : undefined}>
                {plan === "pro" ? "AI Readiness Pro" : "Free plan"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                {plan === "pro"
                  ? `Subscription status: ${meta?.subscriptionStatus ?? "active"}. Thank you for being a Pro member.`
                  : "Upgrade for industry benchmarks, the 12-month roadmap, comparison mode and clean exports."}
              </p>
            </div>
            {plan === "pro" && (
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

          {/* Feature grid */}
          <div className="mt-8 pt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {PRO_HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="rounded-lg p-2 flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <item.Icon className={`h-4 w-4 ${plan === "pro" ? "text-white" : "text-white/50"}`} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-bold ${plan === "pro" ? "text-white" : "text-white/70"}`}>{item.title}</p>
                    {plan === "pro" && <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#5eead4" }} strokeWidth={2.5} />}
                  </div>
                  <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Framework preview — always visible, builds familiarity */}
        <div className="mt-10 rounded-3xl p-6 md:p-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">The framework</p>
              <h2 className="mt-2 text-2xl font-black text-white tracking-tight">8 dimensions of AI readiness</h2>
              <p className="mt-1 text-sm text-white/60">Aligned with Microsoft, AIMRI and EU AI Act standards.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/90 transition hover:text-white hover:bg-white/5"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Run an assessment <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PILLAR_PREVIEW.map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="rounded-lg p-2 flex-shrink-0" style={{ background: `${p.color}22`, border: `1px solid ${p.color}44` }}>
                  <p.Icon className="h-4 w-4" style={{ color: p.color }} strokeWidth={2.2} />
                </div>
                <p className="text-sm font-semibold text-white/90">{p.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security / account management */}
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">Account</p>
            <p className="mt-2 text-sm text-white/80">Manage your password, email, and connected accounts.</p>
            <p className="mt-3 text-xs text-white/50">Click your avatar in the top-right to open account settings.</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">Data</p>
            <p className="mt-2 text-sm text-white/80">Your assessments are stored locally in your browser.</p>
            <p className="mt-3 text-xs text-white/50">Cloud sync across devices is coming in a future Pro update.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
