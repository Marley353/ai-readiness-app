"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";

export function TopNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`nav ${scrolled ? "scrolled" : ""}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "14px 24px",
        transition: "background 240ms ease, border-color 240ms ease, backdrop-filter 240ms ease",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
        background: scrolled ? "rgba(8,13,26,0.75)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 32,
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 600,
            color: "#fff",
            fontSize: 17,
            textDecoration: "none",
            letterSpacing: "-0.3px",
          }}
        >
          <img src="/logo.svg" alt="AI Readiness" width={30} height={30} className="nav-logo-icon" />
          AI Readiness
        </Link>

        {/* Centre links */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 32 }}>
          {[
            { href: "#scorecard", label: "Scorecard" },
            { href: "#framework", label: "Framework" },
            { href: "#how-it-works", label: "How it works" },
            { href: "/about", label: "About" },
            { href: "#pricing", label: "Pricing" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                color: "rgba(255,255,255,0.65)",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 460,
                letterSpacing: "-0.1px",
                transition: "color 150ms ease",
              }}
              className="hover:!text-white"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {isLoaded && isSignedIn ? (
            <>
              <Link
                href="/app"
                className="btn btn-secondary"
                style={{ padding: "10px 16px", fontSize: 14, textDecoration: "none" }}
              >
                Open app
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                style={{
                  fontSize: 15,
                  fontWeight: 540,
                  color: "rgba(255,255,255,0.8)",
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
              <button
                onClick={() => window.location.href = "/app"}
                className="btn btn-primary"
                style={{ padding: "10px 16px", fontSize: 14, border: "none", cursor: "pointer" }}
              >
                <span>Start Free Assessment</span>
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes logoPulse {
          0%, 100% { filter: drop-shadow(0 0 0px rgba(77,163,255,0)); }
          50% { filter: drop-shadow(0 0 8px rgba(77,163,255,0.6)); }
        }
        .nav-logo-icon {
          animation: logoPulse 3s ease-in-out infinite;
        }
        @media (min-width: 880px) {
          .nav .hidden.md\\:flex { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
