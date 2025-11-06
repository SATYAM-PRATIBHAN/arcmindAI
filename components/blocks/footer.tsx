"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DOC_ROUTES } from "@/lib/routes";

export function Footer() {
  const navigation = [
    { name: "Home", href: DOC_ROUTES.HOME },
    { name: "About Us", href: DOC_ROUTES.ABOUT },
    { name: "Pricing", href: DOC_ROUTES.PRICING },
    { name: "FAQ", href: `${DOC_ROUTES.HOME}#faq` },
    { name: "Generate", href: DOC_ROUTES.GENERATE },
    { name: "Contact", href: DOC_ROUTES.CONTACT },
  ];

  const social = [
    { name: "X", href: DOC_ROUTES.SOCIAL.X },
    { name: "LinkedIn", href: DOC_ROUTES.SOCIAL.LINKEDIN },
    { name: "Portfolio", href: DOC_ROUTES.SOCIAL.PORTFOLIO },
  ];

  const legal = [{ name: "Privacy Policy", href: DOC_ROUTES.PRIVACY_POLICY }];

  // Animation setup
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer
      ref={ref}
      className="flex max-w-5xl mx-auto flex-col items-center gap-14 pt-28 lg:pt-32 px-2 overflow-hidden"
    >
      {/* CTA Section */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="container space-y-3 text-center"
      >
        <h2 className="text-2xl tracking-tight md:text-4xl lg:text-5xl">
          Start your free trial today
        </h2>
        <p className="text-muted-foreground mx-auto max-w-xl leading-snug text-balance">
          arcmindAI is the fit-for-purpose tool for planning and building modern
          software products.
        </p>
        <div>
          <Button size="lg" className="mt-4" asChild>
            <a href={DOC_ROUTES.SOCIAL.GITHUB}>Star us on GitHub</a>
          </Button>
        </div>
      </motion.div>

      {/* Navigation Section */}
      <motion.nav
        variants={fadeUp}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
        className="container flex flex-col items-center gap-4"
      >
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {navigation.map((item, i) => (
            <motion.li
              key={item.name}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ delay: 0.25 + i * 0.05, duration: 0.5 }}
            >
              <Link
                href={item.href}
                className="font-medium transition-opacity hover:opacity-75"
              >
                {item.name}
              </Link>
            </motion.li>
          ))}
          {social.map((item, i) => (
            <motion.li
              key={item.name}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
            >
              <Link
                href={item.href}
                className="flex items-center gap-0.5 font-medium transition-opacity hover:opacity-75"
              >
                {item.name} <ArrowUpRight className="size-4" />
              </Link>
            </motion.li>
          ))}
        </ul>

        <ul className="flex flex-wrap items-center justify-center gap-6">
          {legal.map((item, i) => (
            <motion.li
              key={item.name}
              variants={fadeUp}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ delay: 0.6 + i * 0.05, duration: 0.5 }}
            >
              <Link
                href={item.href}
                className="text-muted-foreground text-sm transition-opacity hover:opacity-75"
              >
                {item.name}
              </Link>
            </motion.li>
          ))}
        </ul>
      </motion.nav>

      {/* Logo Section */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        className="text-primary flex items-center justify-center mt-10 w-full md:mt-14 lg:mt-16"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 13.35 246.35 36.85"
          width="1240"
          height="293"
          className="w-auto h-auto"
        >
          <defs>
            <linearGradient id="textGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" />
              <stop offset="100%" stopColor="#F8F8F8" stopOpacity="0.41" />
            </linearGradient>
          </defs>
          <g fill="url(#textGradient)">
            <g transform="translate(0, 0)">
              <path d="M0 49.60L12.80 14.60L19.50 14.60L32.30 49.60L25.95 49.60L16.10 21.60L16.10 21.60L6.25 49.60L0 49.60M5.70 41.35L7.30 36.60L24.55 36.60L26.15 41.35L5.70 41.35ZM36.90 49.60L36.90 24.40L42.25 24.40L42.80 29.10L42.80 29.10Q43.70 27.45 45.05 26.27Q46.40 25.10 48.23 24.45Q50.05 23.80 52.25 23.80L52.25 30.15L50.15 30.15Q48.65 30.15 47.30 30.53Q45.95 30.90 44.98 31.73Q44.00 32.55 43.45 33.98Q42.90 35.40 42.90 37.55L42.90 49.60L36.90 49.60ZM68.15 50.20Q64.45 50.20 61.53 48.52Q58.60 46.85 56.98 43.88Q55.35 40.90 55.35 37.10Q55.35 33.15 56.98 30.18Q58.60 27.20 61.53 25.50Q64.45 23.80 68.20 23.80Q72.90 23.80 76.10 26.27Q79.30 28.75 80.20 33.05L73.90 33.05Q73.40 31.15 71.83 30.05Q70.25 28.95 68.10 28.95Q66.25 28.95 64.73 29.90Q63.20 30.85 62.33 32.65Q61.45 34.45 61.45 37Q61.45 38.95 61.95 40.45Q62.45 41.95 63.38 42.98Q64.30 44 65.50 44.55Q66.70 45.10 68.10 45.10Q69.55 45.10 70.73 44.63Q71.90 44.15 72.73 43.20Q73.55 42.25 73.90 40.95L80.20 40.95Q79.30 45.15 76.10 47.68Q72.90 50.20 68.15 50.20ZM86.20 49.60L86.20 14.60L93.30 14.60L104.50 37.20L104.50 37.20L115.60 14.60L122.75 14.60L122.75 49.60L116.75 49.60L116.75 24.90L116.75 24.90L106.85 44.70L102.15 44.70L92.20 24.95L92.20 24.95L92.20 49.60L86.20 49.60ZM129.90 49.60L129.90 24.40L135.90 24.40L135.90 49.60L129.90 49.60M132.90 20.40Q131.25 20.40 130.18 19.38Q129.10 18.35 129.10 16.85Q129.10 15.30 130.18 14.33Q131.25 13.35 132.90 13.35Q134.55 13.35 135.63 14.33Q136.70 15.30 136.70 16.85Q136.70 18.35 135.63 19.38Q134.55 20.40 132.90 20.40ZM142.85 49.60L142.85 24.40L148.15 24.40L148.60 28.60L148.60 28.60Q149.75 26.40 151.90 25.10Q154.05 23.80 157 23.80Q160.05 23.80 162.20 25.07Q164.35 26.35 165.53 28.80Q166.70 31.25 166.70 34.90L166.70 49.60L160.70 49.60L160.70 35.45Q160.70 32.30 159.30 30.60Q157.90 28.90 155.15 28.90Q153.35 28.90 151.93 29.75Q150.50 30.60 149.68 32.23Q148.85 33.85 148.85 36.15L148.85 49.60L142.85 49.60ZM184.25 50.20Q180.75 50.20 178 48.50Q175.25 46.80 173.72 43.80Q172.20 40.80 172.20 37Q172.20 33.20 173.75 30.23Q175.30 27.25 178.07 25.52Q180.85 23.80 184.35 23.80Q187.20 23.80 189.32 24.88Q191.45 25.95 192.70 27.90L192.70 13.60L198.70 13.60L198.70 49.60L193.30 49.60L192.70 45.95L192.70 45.95Q191.90 47.05 190.75 48.02Q189.60 49 188 49.60Q186.40 50.20 184.25 50.20M185.50 45Q187.65 45 189.30 43.98Q190.95 42.95 191.85 41.15Q192.75 39.35 192.75 37Q192.75 34.65 191.85 32.85Q190.95 31.05 189.30 30.05Q187.65 29.05 185.50 29.05Q183.45 29.05 181.80 30.05Q180.15 31.05 179.22 32.85Q178.30 34.65 178.30 37Q178.30 39.35 179.22 41.15Q180.15 42.95 181.80 43.98Q183.45 45 185.50 45ZM203.25 49.60L216.05 14.60L222.75 14.60L235.55 49.60L229.20 49.60L219.35 21.60L219.35 21.60L209.50 49.60L203.25 49.60M208.95 41.35L210.55 36.60L227.80 36.60L229.40 41.35L208.95 41.35ZM240.35 49.60L240.35 14.60L246.35 14.60L246.35 49.60L240.35 49.60Z" />
            </g>
          </g>
        </svg>
      </motion.div>
    </footer>
  );
}
