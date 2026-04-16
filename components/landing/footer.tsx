import Link from "next/link";

export function Footer() {
  return (
    <footer style={{ background: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white">
              <span
                className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black"
                style={{ background: "linear-gradient(135deg, #0066ff, #ec4899)" }}
              >
                AI
              </span>
              AI Readiness
            </Link>
            <p className="mt-4 text-sm text-white/60 max-w-md leading-relaxed">
              The professional 8-dimension AI readiness assessment. Industry benchmarks, a 12-month roadmap and board-ready exports — all in one beautifully designed tool.
            </p>
          </div>

          {/* Product links */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Product</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/app" className="text-sm text-white/70 hover:text-white transition">Start assessment</Link></li>
              <li><Link href="/pricing" className="text-sm text-white/70 hover:text-white transition">Pricing</Link></li>
              <li><Link href="/account" className="text-sm text-white/70 hover:text-white transition">Account</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Legal</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="#" className="text-sm text-white/70 hover:text-white transition">Privacy</Link></li>
              <li><Link href="#" className="text-sm text-white/70 hover:text-white transition">Terms</Link></li>
              <li><a href="mailto:support@aireadiness.app" className="text-sm text-white/70 hover:text-white transition">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/40">© {new Date().getFullYear()} AI Readiness. All rights reserved.</p>
          <p className="text-xs text-white/40">Aligned with Microsoft, AIMRI & EU AI Act standards.</p>
        </div>
      </div>
    </footer>
  );
}
