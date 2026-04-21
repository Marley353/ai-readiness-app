import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "#0a0a0a" }}>
      <div className="absolute -top-40 -right-40 w-[32rem] h-[32rem] rounded-full opacity-40 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #ffb770, transparent 60%)" }} />
      <div className="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] rounded-full opacity-30 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #ffb770, transparent 60%)" }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">AI Readiness</p>
          <h1 className="mt-2 text-3xl font-black text-white tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-white/60">Free forever. Upgrade to Pro anytime.</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
