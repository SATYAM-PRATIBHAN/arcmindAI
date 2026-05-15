"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { DOC_ROUTES } from "@/lib/routes";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen max-w-5xl mx-auto text-center px-6 my-16 md:my-24 lg:my-48 overflow-visible">
      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-6xl font-semibold text-foreground"
      >
        Design Smarter Systems with{" "}
        <span className="text-muted-foreground">ArcMind AI</span>
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-2xl mt-4 text-muted-foreground"
      >
        Generate intelligent system architectures, visualize diagrams, and
        export your designs all powered by AI.
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-8 flex gap-3"
      >
        <Link href={DOC_ROUTES.GENERATE}>
          <Button className="cursor-pointer px-6 py-5 text-base font-medium">
            Start Creating
          </Button>
        </Link>
        <Link href={DOC_ROUTES.ABOUT}>
          <Button
            variant="outline"
            className="cursor-pointer px-6 py-5 text-base font-medium"
          >
            Know More
          </Button>
        </Link>
      </motion.div>

      {/* Preview Image with CIRCULAR GLOW (not square) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="mt-12 w-full max-w-5xl relative group flex justify-center"
      >
        {/* Hero card with circular glow */}
        <div className="hero-card relative rounded-xl overflow-hidden shadow-2xl w-full">
          {/* Light mode image */}
          <div className="block dark:hidden">
            <Image
              src="/heroImage.webp"
              alt="ArcMind AI preview - Light mode"
              width={1200}
              height={700}
              className="w-full h-auto block"
              priority
            />
          </div>
          {/* Dark mode image */}
          <div className="hidden dark:block">
            <Image
              src="/hero-dark.webp"
              alt="ArcMind AI preview - Dark mode"
              width={1200}
              height={700}
              className="w-full h-auto block"
              priority
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}