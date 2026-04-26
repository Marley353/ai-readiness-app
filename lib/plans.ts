// Central source of truth for the Free / Pro split — used by both the
// pricing page and the feature gates throughout the app.

export type Plan = "free" | "pro";

export const FREE_FEATURES = [
  "8-dimension assessment",
  "Overall readiness score & maturity band",
  "Radar chart of current scores",
  "One saved assessment at a time",
  "Basic PDF export (watermarked)",
];

export const PRO_FEATURES = [
  "Everything in Free",
  "Detailed sector-specific strategic recommendations",
  "Industry benchmarks on every chart",
  "12-month phased maturity roadmap",
  "Clean PDF export (no watermark)",
  "Side-by-side comparison of multiple assessments",
  "Unlimited saved assessments",
  "Email sharing & team handoff",
  "Priority access to new features",
];

export const PRICING = {
  monthly: {
    amount: 15,
    currency: "GBP" as const,
    interval: "month" as const,
    label: "Monthly",
    strapline: "Flexible, cancel anytime",
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY ?? "",
  },
  annual: {
    amount: 129.99,
    currency: "GBP" as const,
    interval: "year" as const,
    label: "Annual",
    strapline: "Best value — save 28% vs. monthly",
    priceId: process.env.STRIPE_PRICE_ID_ANNUAL ?? "",
  },
};

// Feature gate key — used at call sites to check whether the current
// user can access a feature. Keeping it a const union so TS catches
// typos at compile time.
export type FeatureKey =
  | "benchmarks"
  | "roadmap"
  | "compare"
  | "unlimitedAssessments"
  | "cleanPdf"
  | "sectorRecommendations"
  | "emailShare";

export const FEATURE_TO_PLAN: Record<FeatureKey, Plan> = {
  benchmarks: "pro",
  roadmap: "pro",
  compare: "pro",
  unlimitedAssessments: "pro",
  cleanPdf: "pro",
  sectorRecommendations: "pro",
  emailShare: "pro",
};
