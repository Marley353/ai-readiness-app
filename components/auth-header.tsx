"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export function AuthHeader() {
  const { isLoaded, isSignedIn } = useAuth();

  // Reserve space while Clerk is loading so the hero doesn't jump.
  if (!isLoaded) {
    return <div className="h-8 w-32" />;
  }

  if (isSignedIn) {
    return (
      <>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/90 transition hover:text-white hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Sparkles className="h-3 w-3" /> Pricing
        </Link>
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/90 transition hover:text-white hover:bg-white/10"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          Account
        </Link>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 ring-2 ring-white/20 hover:ring-white/40 transition",
            },
          }}
        />
      </>
    );
  }

  return (
    <>
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white/90 transition hover:text-white hover:bg-white/10"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        Sign in
      </Link>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-black bg-white transition hover:scale-[1.02] hover:shadow-[0_0_16px_rgba(255,255,255,0.3)]"
      >
        <Sparkles className="h-3 w-3" /> Upgrade to Pro
      </Link>
    </>
  );
}
