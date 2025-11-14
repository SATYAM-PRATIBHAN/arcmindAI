"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOC_ROUTES } from "@/lib/routes";
import { Sparkles, Zap, Shield, Code, Layers, Rocket } from "lucide-react";

export default function About() {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered",
      description:
        "Leverage cutting-edge AI to generate intelligent system architectures from simple descriptions.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Transform ideas into complete system designs in seconds, not days.",
    },
    {
      icon: Shield,
      title: "Production Ready",
      description:
        "Generate scalable, well-documented architectures ready for deployment.",
    },
    {
      icon: Code,
      title: "Tech Stack Integration",
      description:
        "Get a unified view of architecture, tech stack, and data flow in one place.",
    },
    {
      icon: Layers,
      title: "Comprehensive Documentation",
      description:
        "Export high-quality diagrams and documentation for your team's workflow.",
    },
    {
      icon: Rocket,
      title: "Streamlined Workflow",
      description:
        "Eliminate scattered documentation and simplify your entire design process.",
    },
  ];

  return (
    <Background variant="top" className="from-black/10 via-muted to-muted/80">
      {/* The main section no longer needs to be a single flex-col.
        We'll apply centering to child sections individually.
      */}
      <section className="relative max-w-5xl mx-auto px-6 py-28 lg:py-38">
        {/* --- 1. Intro Section --- */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              About{" "}
              <span className="bg-linear-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent">
                ArcMind AI
              </span>
            </h1>

            <p className="max-w-3xl mx-auto text-muted-foreground text-lg leading-relaxed">
              ArcMind AI is an intelligent architecture generation platform that
              helps developers, architects, and product teams design smarter
              systems — faster. We bridge the gap between imagination and
              technical structure using automation and modern AI.
            </p>
          </motion.div>
        </div>

        {/* --- 2. Mission & Vision Section (NEW 2-COL LAYOUT) --- */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 text-left"
        >
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-foreground">
              Our Mission
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To simplify system design and empower teams to create intelligent,
              scalable, and future-ready architectures through automation and AI
              — enabling seamless collaboration between human creativity and
              machine intelligence.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-foreground">
              Our Vision
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We envision a world where developers and architects can
              collaborate with AI to turn high-level ideas into structured,
              efficient, and production-ready systems — transforming the way
              digital infrastructure is built.
            </p>
          </div>
        </motion.div>

        {/* --- 3. Features Section --- */}
        <div className="mt-24 text-center">
          {/* Feature Intro (New) */}
          <motion.div
            className="mb-12 lg:mb-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
              What Makes ArcMind Different?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              We&apos;ve built a platform focused on speed, quality, and
              seamless integration for modern development teams.
            </p>
          </motion.div>

          {/* Feature Grid (Original) */}
          <div className="w-full max-w-5xl mx-auto">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                >
                  <Card className="h-full border border-gray-200 dark:border-gray-800 hover:shadow-md bg-background/60 backdrop-blur-sm text-left">
                    <CardHeader className="flex flex-col items-start space-y-2">
                      <feature.icon className="h-7 w-7 text-primary" />
                      <CardTitle className="text-xl text-foreground font-semibold">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* --- 4. Call to Action --- */}
        <div className="mt-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-20 space-y-4"
          >
            <p className="text-foreground text-lg font-medium">
              Ready to design your next architecture?
            </p>
            <Link href={DOC_ROUTES.GENERATE}>
              <Button
                size="lg"
                className="cursor-pointer px-8 py-5 text-base font-medium"
              >
                Start Creating
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Background>
  );
}
