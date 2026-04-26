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
import { RevealObserver } from "@/components/landing/reveal-observer";

export default function LandingPage() {
  return (
    <>
      <RevealObserver />
      <TopNav />
      {/* D */} <Hero />
      {/* L */} <ScorecardPreview />
      {/* D */} <AiGap />
      {/* L */} <DimensionsGrid />
      {/* D */} <HowItWorks />
      {/* L */} <TierBenchmark />
      {/* D */} <FeatureSlabs />
      {/* L */} <Personas />
      {/* D */} <PricingTeaser />
      {/* L */} <Faq />
      {/* D */} <FinalCta />
      {/* D */} <Footer />
    </>
  );
}
