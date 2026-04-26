"use client";

import { useUser } from "@clerk/nextjs";
import type { Plan, FeatureKey } from "@/lib/plans";
import { FEATURE_TO_PLAN } from "@/lib/plans";

// Reads the user's plan from their Clerk publicMetadata. When a Stripe
// webhook fires for a successful subscription we stamp { plan: "pro" }
// onto publicMetadata so the client picks it up on next render.
// Anonymous visitors (SignedOut) always resolve to "free".
export function usePlan(): { plan: Plan; isLoaded: boolean; isSignedIn: boolean } {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) return { plan: "free", isLoaded: false, isSignedIn: false };
  if (!isSignedIn || !user) return { plan: "free", isLoaded: true, isSignedIn: false };
  const meta = user.publicMetadata as { plan?: Plan } | null | undefined;
  const plan: Plan = meta?.plan === "pro" ? "pro" : "free";
  return { plan, isLoaded: true, isSignedIn: true };
}

export function useCanUse(feature: FeatureKey): boolean {
  const { plan } = usePlan();
  const required = FEATURE_TO_PLAN[feature];
  if (required === "free") return true;
  return plan === "pro";
}
