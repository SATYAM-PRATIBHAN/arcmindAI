"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { DOC_ROUTES } from "@/lib/routes";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen max-w-5xl mx-auto text-center px-6 my-16 md:my-24 lg:my-48 overflow-hidden">
      {/* Heading */}
      <a
        href="https://www.producthunt.com/products/arcmind-ai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-arcmind-ai"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1045558&theme=light&t=1764930733253"
          alt="Arcmind AI - Design Smarter Systems using AI | Product Hunt"
          style={{ width: 250, height: 54 }}
          width={250}
          height={54}
          className="mb-4"
        />
      </a>
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-6xl font-semibold text-gray-900 dark:text-gray-100"
      >
        Design Smarter Systems with{" "}
        <span className="text-gray-700 dark:text-gray-300">ArcMind AI</span>
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-2xl mt-4 text-gray-600 dark:text-gray-400"
      >
        Generate intelligent system architecture architectures, visualize
        diagrams, and export your designs all powered by AI.
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-8 flex gap-3"
      >
        <Link href={DOC_ROUTES.GENERATE}>
          <Button className="cursor-pointer px-6 py-5 text-base">
            Start Creating
          </Button>
        </Link>
        <Link href={DOC_ROUTES.ABOUT}>
          <Button
            variant="outline"
            className="cursor-pointer px-6 py-5 text-base"
          >
            Know More
          </Button>
        </Link>
      </motion.div>

      {/* Bento Preview Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="mt-12 w-full max-w-5xl"
      >
        <Image
          src="/heroImage.webp"
          alt="ArcMind AI preview"
          width={1200}
          height={700}
          className="rounded-xl shadow-lg border-3 border-gray-700  dark:border-gray-800"
        />
      </motion.div>
    </section>
  );
}
