"use client";

import Link from "next/link";
import { Sparkles, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useCanUse } from "@/lib/use-plan";
import type { FeatureKey } from "@/lib/plans";

type Props = {
  feature: FeatureKey;
  children: ReactNode;
  // The visual treatment when the user doesn't have access:
  //   - "overlay": show the children behind a blur + upgrade CTA (good for charts)
  //   - "replace": hide children entirely and show a compact upsell card
  variant?: "overlay" | "replace";
  // Short label for the upsell card (e.g. "Industry benchmarks", "12-month roadmap").
  title?: string;
  description?: string;
};

export function ProGate({ feature, children, variant = "overlay", title, description }: Props) {
  const canUse = useCanUse(feature);
  if (canUse) return <>{children}</>;

  if (variant === "replace") {
    return <UpsellCard title={title} description={description} />;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <UpsellCard title={title} description={description} compact />
      </div>
    </div>
  );
}

function UpsellCard({ title = "Pro feature", description, compact = false }: { title?: string; description?: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-2xl ${compact ? "p-4" : "p-6"} text-center shadow-lg max-w-md mx-auto`}
      style={{
        background: "linear-gradient(140deg, rgba(0,102,255,0.08), rgba(168,85,247,0.06) 60%, rgba(236,72,153,0.08)), #0a0a0a",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
        <Lock className="h-4 w-4 text-white" strokeWidth={2.2} />
      </div>
      <h4 className="font-black text-white tracking-tight">{title}</h4>
      {description && <p className="mt-1.5 text-xs text-white/70 leading-relaxed">{description}</p>}
      <Link
        href="/pricing"
        className="group mt-4 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-black bg-white transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,255,255,0.3)]"
      >
        <Sparkles className="h-3 w-3" /> Upgrade to Pro
      </Link>
    </div>
  );
}
