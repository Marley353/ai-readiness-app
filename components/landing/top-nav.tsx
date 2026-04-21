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
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "14px 24px",
        transition: "background 240ms ease, border-color 240ms ease, backdrop-filter 240ms ease",
        borderBottom: "1px solid transparent",
        ...(scrolled
          ? {
              background: "rgba(250, 248, 245, 0.72)",
              backdropFilter: "saturate(1.4) blur(14px)",
              WebkitBackdropFilter: "saturate(1.4) blur(14px)",
              borderBottomColor: "var(--parchment-border)",
            }
          : {}),
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
            fontWeight: 540,
            color: "var(--fg-1)",
            fontSize: 16,
            textDecoration: "none",
            letterSpacing: "-0.3px",
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "var(--charcoal-ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 4,
                borderRadius: 4,
                background: "conic-gradient(from 0deg, var(--lavender-glow), #fff, var(--lavender-glow))",
                animation: "spinSlow 8s linear infinite",
                opacity: 0.9,
              }}
            />
          </span>
          Digital Readiness AI
        </Link>

        {/* Centre links */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 32 }}>
          {[
            { href: "#scorecard", label: "Scorecard" },
            { href: "#framework", label: "Framework" },
            { href: "#how-it-works", label: "How it works" },
            { href: "/about", label: "About" },
            { href: "/pricing", label: "Pricing" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                color: "var(--fg-2)",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 460,
                letterSpacing: "-0.1px",
                transition: "color 150ms ease",
              }}
              className="hover:!text-[var(--fg-1)]"
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
                  color: "var(--fg-1)",
                  textDecoration: "none",
                }}
              >
                Sign in
              </Link>
              <Link
                href="/app"
                className="btn btn-primary"
                style={{ padding: "10px 16px", fontSize: 14, textDecoration: "none" }}
              >
                <span>Start scorecard</span>
              </Link>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (min-width: 880px) {
          .nav .hidden.md\\:flex { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
