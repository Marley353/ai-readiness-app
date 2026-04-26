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
  Shield,
  Lock,
  ArrowUpRight,
} from "lucide-react";

const PILLAR_PREVIEW = [
  { Icon: Compass, label: "Strategy" },
  { Icon: Users, label: "People" },
  { Icon: Workflow, label: "Process" },
  { Icon: Database, label: "Data" },
  { Icon: Cpu, label: "Technology" },
  { Icon: Scale, label: "Ethics" },
  { Icon: Heart, label: "Culture" },
  { Icon: Rocket, label: "Innovation" },
];

const PRO_FEATURES_COMPACT = [
  { Icon: TrendingUp, title: "12-month roadmap" },
  { Icon: Activity, title: "Industry benchmarks" },
  { Icon: Building2, title: "Compare mode" },
  { Icon: FileText, title: "Clean PDF export" },
  { Icon: Mail, title: "Email sharing" },
  { Icon: Target, title: "Sector recommendations" },
];

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in?redirect_url=/account");

  const meta = user.publicMetadata as { plan?: "free" | "pro"; subscriptionStatus?: string } | null;
  const plan = meta?.plan === "pro" ? "pro" : "free";
  const firstName = user.firstName || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "there";
  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Slim top bar — Vercel-style */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: "rgba(10,10,10,0.75)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-10 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white">
            <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black" style={{ background: "#c4661a" }}>AI</span>
            AI Readiness
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/app" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition">
              ← Back to app
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 pt-10 md:pt-14 pb-20 md:px-10">
        {/* Breadcrumb + Title */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">Account</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-black text-white tracking-tight">Overview</h1>
        <p className="mt-2 text-sm text-white/55 max-w-2xl">Your profile, subscription and workspace at a glance. Everything you need to manage your AI Readiness account.</p>

        {/* Hero profile card — Vercel-style composite */}
        <section className="mt-10 rounded-2xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
            {user.imageUrl ? (
              <Image src={user.imageUrl} alt={firstName} width={80} height={80} className="rounded-full ring-1 ring-white/10 object-cover flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-full flex-shrink-0 ring-1 ring-white/10 flex items-center justify-center text-3xl font-black text-white" style={{ background: "#c4661a" }}>
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-white tracking-tight truncate">{firstName}</h2>
                {plan === "pro" ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-white" style={{ background: "#ffb770" }}>
                    <Sparkles className="h-3 w-3" /> PRO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-white/70" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    FREE
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-white/60 truncate">{email}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-white/40 flex-wrap">
                <span>Member since {memberSince}</span>
                <span className="hidden sm:inline">•</span>
                <span>ID: <span className="font-mono text-white/50">{user.id.slice(-8)}</span></span>
              </div>
            </div>
            {plan === "free" && (
              <Link
                href="/pricing"
                className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-black bg-white transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,255,255,0.3)]"
              >
                <Sparkles className="h-4 w-4" /> Upgrade to Pro
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </section>

        {/* Two-column grid: Plan + Quick links */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Plan overview — 2 cols wide on desktop */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: plan === "pro" ? "linear-gradient(140deg, rgba(255,183,112,0.1), rgba(196,102,26,0.05) 60%, rgba(255,183,112,0.1)), #111" : "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">Subscription</p>
                  <h3 className="mt-2 text-2xl font-black text-white tracking-tight">
                    {plan === "pro" ? "AI Readiness Pro" : "Free plan"}
                  </h3>
                  <p className="mt-2 text-sm text-white/55 max-w-md">
                    {plan === "pro"
                      ? `Your subscription is ${meta?.subscriptionStatus ?? "active"}. Renewal handled automatically.`
                      : "You're on the free tier. Upgrade for industry benchmarks, the 12-month roadmap, comparison mode and clean exports."}
                  </p>
                </div>
                {plan === "pro" ? (
                  <a
                    href="https://billing.stripe.com/p/login/test_dR6bIO2cpe4Cf3abII"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/90 transition hover:text-white hover:bg-white/5 flex-shrink-0"
                    style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    Manage billing <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/90 transition hover:text-white hover:bg-white/5 flex-shrink-0"
                    style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    View plans <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {/* Feature grid */}
              <div className="mt-8 grid gap-px rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                {PRO_FEATURES_COMPACT.map((item) => (
                  <div
                    key={item.title}
                    className="p-3.5 flex items-center gap-2.5"
                    style={{ background: "#111111" }}
                  >
                    <item.Icon className={`h-3.5 w-3.5 flex-shrink-0 ${plan === "pro" ? "text-white" : "text-white/30"}`} strokeWidth={2.2} />
                    <p className={`text-xs font-semibold ${plan === "pro" ? "text-white" : "text-white/40"}`}>{item.title}</p>
                    {plan === "pro" && <CheckCircle2 className="h-3 w-3 ml-auto flex-shrink-0" style={{ color: "#5eead4" }} strokeWidth={2.5} />}
                    {plan !== "pro" && <Lock className="h-3 w-3 ml-auto flex-shrink-0 text-white/30" strokeWidth={2.2} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick links stack */}
          <aside className="space-y-3">
            <div className="rounded-2xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-3.5 w-3.5 text-white/60" strokeWidth={2.2} />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Security</p>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">Manage your password, email and connected accounts.</p>
              <p className="mt-3 text-xs text-white/45">Click your avatar in the top-right of the app to open profile settings.</p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-3.5 w-3.5 text-white/60" strokeWidth={2.2} />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Your data</p>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">Assessments are stored locally in your browser.</p>
              <p className="mt-3 text-xs text-white/45">Cloud sync across devices is planned for a future Pro update.</p>
            </div>
          </aside>
        </section>

        {/* Framework reference — clean horizontal row */}
        <section className="mt-6 rounded-2xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">Framework</p>
                <h3 className="mt-2 text-xl font-black text-white tracking-tight">The 8 dimensions of AI readiness</h3>
              </div>
              <Link
                href="/app"
                className="group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
              >
                Run assessment <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
              {PILLAR_PREVIEW.map((p) => (
                <div key={p.label} className="flex items-center gap-2.5 rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p.Icon className="h-3.5 w-3.5 text-white/70 flex-shrink-0" strokeWidth={2.2} />
                  <p className="text-xs font-semibold text-white/85">{p.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer meta */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-white/30">
            Need help? <a href="mailto:support@aireadiness.app" className="text-white/60 hover:text-white transition">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
