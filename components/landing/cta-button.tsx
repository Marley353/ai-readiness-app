"use client";

import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
  variant?: "solid" | "ghost";
  size?: "md" | "lg";
  style?: CSSProperties;
};

// The single CTA button used across all landing sections (M3.2).
// Solid = warm-amber brand fill; ghost = outline on dark.
export function CtaButton({ children, href = "/app", variant = "solid", size = "md", style }: Props) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: size === "lg" ? "16px 36px" : "14px 28px",
    fontSize: size === "lg" ? 16 : 15,
    fontWeight: 600,
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "transform 200ms ease, box-shadow 200ms ease, background 200ms ease",
  };

  const variants: Record<string, CSSProperties> = {
    solid: {
      background: "var(--lavender-glow)",
      color: "#080D1A",
      boxShadow: "0 4px 24px rgba(255,183,112,0.25)",
    },
    ghost: {
      background: "rgba(255,255,255,0.05)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,0.2)",
    },
  };

  return (
    <button
      onClick={() => (window.location.href = href)}
      className="cta-button hover:scale-105 transition-all duration-200"
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}
