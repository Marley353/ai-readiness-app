"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";

export function TopNav() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "#fff",
        borderBottom: "1px solid var(--parchment-border)",
      }}
    >
      <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1200, padding: "20px 40px" }}>
        {/* Left — logo + links */}
        <div className="flex items-center gap-11">
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
            {/* Inline wordmark matching the SVG logo from the design bundle */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 40" fill="none" style={{ height: 24 }}>
              <g>
                <path d="M6 8 L6 32 L14 32" stroke="#292827" strokeWidth="2" strokeLinecap="square" fill="none" />
                <path d="M34 8 L34 32 L26 32" stroke="#292827" strokeWidth="2" strokeLinecap="square" fill="none" />
                <circle cx="20" cy="20" r="5" fill="#cbb7fb" />
                <circle cx="20" cy="20" r="2" fill="#1b1938" />
              </g>
              <text x="52" y="26" fontFamily="Inter, system-ui, sans-serif" fontWeight="540" fontSize="18" letterSpacing="-0.4" fill="#292827">Digital Readiness</text>
              <text x="228" y="26" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="18" letterSpacing="-0.2" fill="#714cb6">AI</text>
            </svg>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            {[
              { href: "/about", label: "About" },
              { href: "/pricing", label: "Pricing" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 15,
                  fontWeight: 460,
                  color: "var(--charcoal-ink)",
                  textDecoration: "none",
                  transition: "color 150ms",
                }}
                className="hover:text-[var(--amethyst-link)]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right — auth */}
        <div className="flex items-center gap-5">
          {isLoaded && isSignedIn ? (
            <>
              <Link
                href="/app"
                style={{
                  fontSize: 15,
                  fontWeight: 540,
                  color: "var(--charcoal-ink)",
                  textDecoration: "none",
                }}
              >
                Open app
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 ring-1 ring-[var(--parchment-border)] hover:ring-[var(--amethyst-link)] transition",
                  },
                }}
              />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                style={{
                  fontSize: 15,
                  fontWeight: 540,
                  color: "var(--charcoal-ink)",
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
              <Link
                href="/app"
                style={{
                  background: "var(--warm-cream)",
                  color: "var(--charcoal-ink)",
                  padding: "10px 18px",
                  borderRadius: "var(--r-sm)",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 150ms",
                }}
                className="hover:bg-[var(--cream-hover)]"
              >
                Start scorecard
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
