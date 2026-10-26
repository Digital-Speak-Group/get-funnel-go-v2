import { Facts } from "./sections/Facts";
import { Features } from "./sections/Features";
import { FinalCta } from "./sections/FinalCta";
import { Frameworks } from "./sections/Frameworks";
import { Hero } from "./sections/Hero";
import { LandingFaq } from "./sections/LandingFaq";
import { PresenterAudience } from "./sections/PresenterAudience";
import { PricingTeaser } from "./sections/PricingTeaser";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Facts />
      <Frameworks />
      <Features />
      <PresenterAudience />
      <PricingTeaser />
      <LandingFaq />
      <FinalCta />
    </>
  );
}
