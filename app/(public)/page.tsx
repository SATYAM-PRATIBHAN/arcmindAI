"use client";

import { Background } from "@/components/background";
import { FAQ } from "@/components/blocks/faq";
import { Features } from "@/components/blocks/features";
import Hero from "@/components/blocks/hero";
import { Pricing } from "@/components/blocks/pricing";

export default function Home() {
  return (
    <Background variant="top" className="from-muted/80 via-muted to-muted/80">
      <div className="flex flex-col min-h-screen justify-center items-center">
        <Hero />
        <Features />
        <Pricing />
        <FAQ />
      </div>
    </Background>
  );
}
