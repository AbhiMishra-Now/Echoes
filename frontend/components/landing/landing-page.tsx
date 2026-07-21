import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { SocialProof } from "@/components/landing/social-proof";
import { Features } from "@/components/landing/features";
import { Showcase } from "@/components/landing/showcase";
import { Benefits } from "@/components/landing/benefits";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { WaitlistCTA } from "@/components/landing/waitlist-cta";
import { Footer } from "@/components/landing/footer";
import { ParallaxRibbon } from "@/components/landing/parallax-ribbon";

export function LandingPage({
  testimonials = [],
}: {
  testimonials?: Array<{
    name: string;
    role: string;
    quote: string;
    avatarInitials: string;
  }>;
}) {
  return (
    <div className="bg-archive grain relative min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <ParallaxRibbon />
        <Showcase />
        <Benefits />
        <Testimonials extras={testimonials} />
        <Pricing />
        <FAQ />
        <WaitlistCTA />
      </main>
      <Footer />
    </div>
  );
}