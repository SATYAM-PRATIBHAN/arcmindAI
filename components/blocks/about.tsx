"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOC_ROUTES } from "@/lib/routes";
import {
  Zap,
  Shield,
  Code,
  ArrowRight,
  Database,
  Server,
  Layout,
  Cpu,
  BarChart3,
  ShieldCheck,
  Search,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function About() {
  const features = [
    {
      icon: Zap,
      title: "Intelligent Synthesis",
      description:
        "Beyond simple templates—our engine understands intent, translating high-level concepts into technical reality.",
    },
    {
      icon: Shield,
      title: "Architectural Integrity",
      description:
        "Every design follows industry-standard patterns, ensuring your foundation is scalable, secure, and production-ready.",
    },
    {
      icon: Code,
      title: "Full-Stack Context",
      description:
        "We don't just draw boxes; we provide the tech stack, data schemas, and API routes that actually make systems work.",
    },
  ];

  const renderSectionHeader = (number: string, title: string) => (
    <div className="flex items-center gap-3 mb-8">
      <div className="bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
        {number}
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
    </div>
  );

  return (
    <Background
      variant="top"
      className="from-black/5 via-background to-background"
    >
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="space-y-6 mt-20">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                The Story of <span className="text-primary">ArcMind</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Bridging the gap between creative imagination and technical
                execution. We&apos;re building the future of how software
                architecture is designed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-24 pt-16">
            <section className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  {renderSectionHeader("01", "Our Mission")}
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Software engineering is often held back by the manual, often
                    fragmented process of designing initial system
                    architectures. We found that teams spend too much time on
                    repetitive boilerplate design and not enough on the unique
                    challenges that actually matter.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    ArcMind AI was born to solve this. Our mission is to provide
                    an intelligent partner that understands the &quot;why&quot;
                    behind your system, automating the standardized patterns so
                    you can focus on the innovation.
                  </p>
                </div>

                <div className="relative w-full aspect-square sm:aspect-video rounded-3xl border border-neutral-200 bg-neutral-50/40 flex items-center justify-center overflow-hidden p-4 sm:p-6">
                  {/* Soft ambient background depth */}
                  <div className="absolute inset-0 bg-radial-gradient from-neutral-100/40 via-transparent to-transparent pointer-events-none" />

                  {/* Broadened container layout for multi-column width */}
                  <div className="relative w-full max-w-2xl flex flex-col items-center gap-4 sm:gap-6 scale-[0.85] sm:scale-100">
                    {/* Tier 1: Top Edge (Global Edge/CDN) */}
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="p-2.5 rounded-xl border border-neutral-300/70 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] flex items-center gap-2.5 w-32 sm:w-36 justify-center"
                    >
                      <Globe className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-[10px] font-medium tracking-wide text-neutral-500">
                        Global CDN
                      </span>
                    </motion.div>

                    {/* Tier 2: Core Entry (UI Layout) */}
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5,
                      }}
                      className="p-3 rounded-xl border border-neutral-300/70 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] flex items-center gap-3 w-36 sm:w-40"
                    >
                      <Layout className="h-4 w-4 text-neutral-500" />
                      <div className="h-1 w-12 sm:h-1 sm:w-14 bg-neutral-200/80 rounded-full" />
                    </motion.div>

                    {/* Tier 3: Horizontal Microservices Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-xl relative px-2">
                      {/* Left Wing: Search */}
                      <motion.div
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.2,
                        }}
                        className="p-3 rounded-xl border border-neutral-300/70 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] flex flex-col items-center gap-1.5"
                      >
                        <Search className="h-4 w-4 text-neutral-400" />
                        <span className="text-[9px] font-medium tracking-wider text-neutral-400">
                          Search
                        </span>
                      </motion.div>

                      {/* Center Left: API */}
                      <motion.div
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.4,
                        }}
                        className="p-3 rounded-xl border border-neutral-300/70 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] flex flex-col items-center gap-1.5"
                      >
                        <Cpu className="h-4 w-4 text-neutral-500" />
                        <span className="text-[9px] font-medium tracking-wider text-neutral-500">
                          API
                        </span>
                      </motion.div>

                      {/* Center Right: Core Logic */}
                      <motion.div
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.6,
                        }}
                        className="p-3 rounded-xl border border-neutral-300/70 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] flex flex-col items-center gap-1.5"
                      >
                        <Server className="h-4 w-4 text-neutral-500" />
                        <span className="text-[9px] font-medium tracking-wider text-neutral-500">
                          Logic
                        </span>
                      </motion.div>

                      {/* Right Wing: Auth & Identity */}
                      <motion.div
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.8,
                        }}
                        className="p-3 rounded-xl border border-neutral-300/70 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] flex flex-col items-center gap-1.5"
                      >
                        <ShieldCheck className="h-4 w-4 text-neutral-400" />
                        <span className="text-[9px] font-medium tracking-wider text-neutral-400">
                          Auth
                        </span>
                      </motion.div>
                    </div>

                    {/* Tier 4: Data Layer Complex */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full justify-center">
                      {/* Flanking Left: Redis Cache */}
                      <motion.div
                        animate={{ x: [-1, 1, -1] }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="p-2 px-3 rounded-lg border border-neutral-300/50 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center gap-2"
                      >
                        <Zap className="h-3 w-3 text-amber-500/80" />
                        <span className="text-[9px] text-neutral-400 font-medium">
                          Cache
                        </span>
                      </motion.div>

                      {/* Main Relational Database */}
                      <motion.div
                        animate={{ y: [0, 2, 0] }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="p-3.5 rounded-xl border border-neutral-300/70 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] flex items-center gap-3 w-36 sm:w-40"
                      >
                        <Database className="h-4 w-4 text-neutral-500" />
                        <div className="h-1 w-14 sm:w-16 bg-neutral-200/80 rounded-full" />
                      </motion.div>

                      {/* Flanking Right: Data Analytics Stream */}
                      <motion.div
                        animate={{ x: [1, -1, 1] }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="p-2 px-3 rounded-lg border border-neutral-300/50 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex items-center gap-2"
                      >
                        <BarChart3 className="h-3 w-3 text-neutral-400" />
                        <span className="text-[9px] text-neutral-400 font-medium">
                          Analytics
                        </span>
                      </motion.div>
                    </div>

                    {/* Elegant Structural Microline Framework */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
                      {/* Central Spine */}
                      <div className="absolute w-px h-[82%] bg-linear-to-b from-transparent via-neutral-300 to-transparent" />
                      {/* Middle Row Horizontal Bus Link */}
                      <div className="absolute w-[70%] h-px bg-neutral-200 top-[53%]" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-8">
              {renderSectionHeader("02", "Core Pillars")}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <Card
                    key={index}
                    className="border-border/60 hover:border-border/100 transition-all duration-300 shadow-none bg-card/30 backdrop-blur-sm group"
                  >
                    <CardHeader className="pb-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl font-bold tracking-tight">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="space-y-8">
              <div className="max-w-4xl">
                {renderSectionHeader("03", "The Vision")}
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold tracking-tight">
                    A future where AI is your Lead Architect.
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We envision a world where the friction between a high-level
                    idea and a functioning technical foundation is zero. ArcMind
                    is evolving into an ecosystem that doesn&apos;t just design,
                    but also helps you evolve, maintain, and scale your systems
                    through every stage of the lifecycle.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Badge
                      variant="outline"
                      className="px-4 py-1.5 rounded-full border-border/60 text-xs font-medium bg-card/50"
                    >
                      Interactive Diagrams
                    </Badge>
                    <Badge
                      variant="outline"
                      className="px-4 py-1.5 rounded-full border-border/60 text-xs font-medium bg-card/50"
                    >
                      Real-time Collaboration
                    </Badge>
                    <Badge
                      variant="outline"
                      className="px-4 py-1.5 rounded-full border-border/60 text-xs font-medium bg-card/50"
                    >
                      Automatic Prototyping
                    </Badge>
                  </div>
                </div>
              </div>
            </section>

            <section className="pt-12 text-center">
              <div className="relative rounded-3xl border border-border/60 bg-linear-to-b from-card/50 to-transparent p-12 lg:p-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

                <div className="relative z-10 space-y-8">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                    Start designing your next <br /> masterpiece today.
                  </h2>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href={DOC_ROUTES.GENERATE}>
                      <Button
                        size="lg"
                        className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                      >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Background>
  );
}
