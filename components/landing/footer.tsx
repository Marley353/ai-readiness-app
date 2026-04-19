import Link from "next/link";

export function Footer() {
  const cols = [
    {
      h: "Product",
      items: [
        { label: "Readiness Scorecard", href: "/app" },
        { label: "Tier benchmarks", href: "/#tiers" },
        { label: "Pricing", href: "/pricing" },
        { label: "About the framework", href: "/about" },
      ],
    },
    {
      h: "Company",
      items: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "mailto:hello@digitalreadiness.ai" },
        { label: "Account", href: "/account" },
      ],
    },
    {
      h: "Legal",
      items: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ];

  return (
    <footer style={{ background: "var(--bg-subtle)", padding: "80px 40px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 2fr",
            gap: 80,
            paddingBottom: 60,
            borderBottom: "1px solid var(--parchment-border)",
          }}
        >
          {/* Brand column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 340 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
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
            <p style={{ fontSize: 14, fontWeight: 460, lineHeight: 1.5, color: "var(--fg-2)", margin: 0 }}>
              The implementation-first platform for organisations moving from AI
              curiosity to operational conviction.
            </p>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--fg-3)" }}>hello@digitalreadiness.ai</span>
          </div>

          {/* Link columns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
            {cols.map((c) => (
              <div key={c.h}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", marginBottom: 16, color: "var(--charcoal-ink)" }}>{c.h}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {c.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      style={{ fontSize: 14, fontWeight: 460, color: "var(--fg-2)", textDecoration: "none" }}
                      className="hover:text-[var(--amethyst-link)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 460, color: "var(--fg-3)" }}>
            © {new Date().getFullYear()} Digital Readiness AI — Built for operators.
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/privacy" style={{ fontSize: 13, color: "var(--fg-3)", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 13, color: "var(--fg-3)", textDecoration: "none" }}>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
