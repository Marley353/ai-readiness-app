"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

// Sticky marketing nav — translucent dark bar over the hero aurora.
export function TopNav() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: "rgba(10,10,10,0.7)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10 h-14 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white">
          <span
            className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black"
            style={{ background: "linear-gradient(135deg, #0066ff, #ec4899)" }}
          >
            AI
          </span>
          AI Readiness
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          <Link
            href="/about"
            className="hidden sm:inline-flex rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition"
          >
            About
          </Link>
          <Link
            href="/pricing"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition"
          >
            Pricing
          </Link>
          {isLoaded && isSignedIn ? (
            <>
              <Link
                href="/app"
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition"
              >
                Open app
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-7 h-7 ring-1 ring-white/20 hover:ring-white/40 transition",
                  },
                }}
              />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition"
              >
                Sign in
              </Link>
              <Link
                href="/app"
                className="group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-black bg-white transition hover:scale-[1.02] hover:shadow-[0_0_16px_rgba(255,255,255,0.3)]"
              >
                <Sparkles className="h-3 w-3" /> Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
