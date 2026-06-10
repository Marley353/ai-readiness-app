"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        padding: "80px 24px 48px",
        background: "var(--charcoal-ink)",
        color: "rgba(255,255,255,0.86)",
        overflow: "hidden",
      }}
    >
      {/* Accent gradient line at top */}
      <div
        style={{
          position: "absolute",
          top: -1,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--lavender-glow), transparent)",
        }}
      />

      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        {/* Top grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 40,
            paddingBottom: 48,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
          className="footer-grid"
        >
          {/* Brand column */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#fff",
                fontWeight: 600,
                fontSize: 17,
                letterSpacing: "-0.3px",
              }}
            >
              <img src="/logo.svg" alt="AI Readiness" width={30} height={30} />
              AI Readiness
            </div>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.65)",
                maxWidth: 320,
                marginTop: 16,
              }}
            >
              The implementation-first platform for organisations moving from AI
              curiosity to operational conviction.
            </p>
          </div>

          {/* Product */}
          <div>
            <h5 style={colHeadStyle}>Product</h5>
            <ul style={colListStyle}>
              <li><Link href="/app" style={linkStyle}>Readiness Scorecard</Link></li>
              <li><Link href="/#framework" style={linkStyle}>Framework</Link></li>
              <li><Link href="/#assessment" style={linkStyle}>How it works</Link></li>
              <li><Link href="/pricing" style={linkStyle}>Pricing</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h5 style={colHeadStyle}>Company</h5>
            <ul style={colListStyle}>
              <li><Link href="/about" style={linkStyle}>About</Link></li>
              <li><Link href="/account" style={linkStyle}>Account</Link></li>
              <li><a href="mailto:hello@digitalreadiness.ai" style={linkStyle}>Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h5 style={colHeadStyle}>Legal</h5>
            <ul style={colListStyle}>
              <li><Link href="/privacy" style={linkStyle}>Privacy</Link></li>
              <li><Link href="/terms" style={linkStyle}>Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            paddingTop: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>© {new Date().getFullYear()} AI Readiness — days, not weeks.</div>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/terms" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Terms</Link>
            <Link href="/privacy" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Privacy</Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 800px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </footer>
  );
}

const colHeadStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "rgba(255,255,255,0.5)",
  marginBottom: 16,
};

const colListStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const linkStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.8)",
  textDecoration: "none",
  fontSize: 14.5,
  transition: "color 150ms ease",
};
