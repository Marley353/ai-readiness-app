import { TopNav } from "@/components/landing/top-nav";
import { Hero } from "@/components/landing/hero";
import { DimensionsGrid } from "@/components/landing/dimensions";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FeatureSlabs } from "@/components/landing/feature-slabs";
import { Personas } from "@/components/landing/personas";
import { PricingTeaser } from "@/components/landing/pricing-teaser";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

// Marketing landing page. The actual assessment tool lives at /app.
export default function LandingPage() {
  return (
    <>
      <TopNav />
      <Hero />
      <DimensionsGrid />
      <HowItWorks />
      <FeatureSlabs />
      <Personas />
      <PricingTeaser />
      <Faq />
      <FinalCta />
      <Footer />
    </>
  );
}
