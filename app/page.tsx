import { TopNav } from "@/components/landing/top-nav";
import { Hero } from "@/components/landing/hero";
import { ScorecardPreview } from "@/components/landing/scorecard-preview";
import { AiGap } from "@/components/landing/ai-gap";
import { DimensionsGrid } from "@/components/landing/dimensions";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TierBenchmark } from "@/components/landing/tier-benchmark";
import { FeatureSlabs } from "@/components/landing/feature-slabs";
import { Personas } from "@/components/landing/personas";
import { PricingTeaser } from "@/components/landing/pricing-teaser";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

// Marketing landing page. The actual assessment tool lives at /app.
// Narrative arc:
//   Hero → Scorecard Preview (value reveal) → AI Gap (problem) →
//   Dimensions (framework) → How it works (agitation→solution) →
//   Tier Benchmark (desire) → Feature slabs → Personas →
//   Pricing teaser → FAQ → Final CTA (action)
export default function LandingPage() {
  return (
    <>
      <TopNav />
      <Hero />
      <ScorecardPreview />
      <AiGap />
      <DimensionsGrid />
      <HowItWorks />
      <TierBenchmark />
      <FeatureSlabs />
      <Personas />
      <PricingTeaser />
      <Faq />
      <FinalCta />
      <Footer />
    </>
  );
}
