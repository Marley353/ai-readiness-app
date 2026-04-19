"use client";

import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { PRICING } from "@/lib/plans";
import { useScrollReveal } from "@/lib/gsap-hooks";

// Compact pricing strip on the landing page — three condensed columns
// that funnel into the full /pricing page.
export function PricingTeaser() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.1 });

  const savings = Math.round(
    ((PRICING.monthly.amount - PRICING.annual.amount / 12) / PRICING.monthly.amount) * 100,
  );

  return (
    <section className="bg-white py-20 md:py-28">
      <div ref={sectionRef} className="mx-auto max-w-5xl px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-12 gsap-reveal">
          <p
            className="text-[11px] uppercase tracking-[0.25em]"
            style={{ fontWeight: 600, color: "var(--fg-3)" }}
          >
            Pricing
          </p>
          <h2
            className="mt-3 text-3xl md:text-5xl tracking-tight leading-tight"
            style={{ fontWeight: 700, color: "var(--fg-1)" }}
          >
            Start free.{" "}
            <em style={{ color: "var(--amethyst-link)", fontStyle: "normal" }}>
              Upgrade when you need more.
            </em>
          </h2>
          <p
            className="mt-4 text-base"
            style={{ fontWeight: 460, color: "var(--fg-2)" }}
          >
            All Pro plans include a{" "}
            <strong style={{ fontWeight: 700, color: "var(--fg-1)" }}>7-day free trial</strong>.
            No charge until day 8. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Free */}
          <article
            className="gsap-reveal glow-hover bg-white"
            style={{
              borderRadius: "var(--r-lg)",
              padding: "1.75rem",
              border: "1px solid var(--parchment-border)",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.2em]"
              style={{ fontWeight: 600, color: "var(--fg-3)" }}
            >
              Free
            </p>
            <div className="mt-3 flex items-baseline gap-1">
              <span
                className="text-5xl tracking-tighter"
                style={{ fontWeight: 700, color: "var(--fg-1)" }}
              >
                £0
              </span>
            </div>
            <p
              className="mt-2 text-xs"
              style={{ fontWeight: 460, color: "var(--fg-3)" }}
            >
              No extra costs · forever
            </p>
            <Link
              href="/app"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm transition"
              style={{
                borderRadius: "var(--r-sm)",
                padding: "0.625rem 1rem",
                fontWeight: 600,
                color: "var(--fg-1)",
                border: "1px solid var(--parchment-border)",
              }}
            >
              Try for free
            </Link>
          </article>

          {/* Monthly */}
          <article
            className="gsap-reveal glow-hover bg-white"
            style={{
              borderRadius: "var(--r-lg)",
              padding: "1.75rem",
              border: "1px solid var(--parchment-border)",
            }}
          >
            <p
              className="text-[11px] uppercase tracking-[0.2em]"
              style={{ fontWeight: 600, color: "var(--fg-3)" }}
            >
              Pro Monthly
            </p>
            <div className="mt-3 flex items-baseline gap-1">
              <span
                className="text-5xl tracking-tighter"
                style={{ fontWeight: 700, color: "var(--fg-1)" }}
              >
                £{PRICING.monthly.amount}
              </span>
              <span
                className="text-sm"
                style={{ fontWeight: 600, color: "var(--fg-3)" }}
              >
                /month
              </span>
            </div>
            <p
              className="mt-2 text-xs"
              style={{ fontWeight: 460, color: "var(--fg-3)" }}
            >
              7-day free trial · cancel anytime
            </p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm transition hover:scale-[1.02]"
              style={{
                borderRadius: "var(--r-sm)",
                padding: "0.625rem 1rem",
                fontWeight: 600,
                color: "var(--charcoal-ink)",
                background: "var(--warm-cream)",
                boxShadow: "var(--shadow-2)",
              }}
            >
              Start free trial
            </Link>
          </article>

          {/* Annual — bestseller */}
          <article
            className="gsap-reveal relative overflow-hidden"
            style={{
              borderRadius: "var(--r-lg)",
              padding: "1.75rem",
              background:
                "linear-gradient(160deg, var(--mysteria-purple-3), var(--mysteria-purple-2) 50%, var(--mysteria-purple))",
              border: "1px solid var(--white-20)",
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 py-1 text-center text-[10px] tracking-[0.3em]"
              style={{
                fontWeight: 700,
                color: "var(--mysteria-purple)",
                background: "var(--lavender-glow)",
              }}
            >
              <Sparkles className="inline h-3 w-3 mr-1" /> BESTSELLER
            </div>
            <div className="pt-5">
              <p
                className="text-[11px] uppercase tracking-[0.2em]"
                style={{ fontWeight: 600, color: "var(--white-60)" }}
              >
                Pro Annual
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span
                  className="text-5xl tracking-tighter"
                  style={{ fontWeight: 700, color: "var(--white-95)" }}
                >
                  £{PRICING.annual.amount}
                </span>
                <span
                  className="text-sm"
                  style={{ fontWeight: 600, color: "var(--white-60)" }}
                >
                  /year
                </span>
              </div>
              <p
                className="mt-2 text-xs"
                style={{ fontWeight: 460, color: "var(--white-60)" }}
              >
                Save {savings}% · ≈ £{(PRICING.annual.amount / 12).toFixed(2)}/month
              </p>
              <Link
                href="/pricing"
                className="group mt-5 inline-flex w-full items-center justify-center gap-2 text-sm transition hover:scale-[1.02]"
                style={{
                  borderRadius: "var(--r-sm)",
                  padding: "0.625rem 1rem",
                  fontWeight: 600,
                  color: "var(--charcoal-ink)",
                  background: "var(--warm-cream)",
                  boxShadow: "var(--shadow-2)",
                }}
              >
                Start free trial
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </article>
        </div>

        <div className="gsap-reveal mt-10 text-center">
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-1.5 text-sm transition"
            style={{
              fontWeight: 600,
              color: "var(--amethyst-link)",
            }}
          >
            See the full feature comparison
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
