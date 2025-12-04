"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DashedLine } from "../dashed-line";
import Link from "next/link";
import { DOC_ROUTES } from "@/lib/routes";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

const plans = [
  {
    name: "Free",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    description: "Perfect for individuals exploring AI architecture design.",
    features: [
      "AI-powered architecture generation (3 total)",
      "Basic tech stack visualization",
      "Download generated diagrams (limited)",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: "$15",
    yearlyPrice: "$150",
    features: [
      "All Free plan features, plus...",
      "Unlimited architecture generations",
      "Unified tech stack planning with customizations",
      "Download complete JSON + diagram files",
      "Full architecture history",
      "Email delivery of system designs",
      "Get defined Frontend Structure",
    ],
  },
  {
    name: "Enterprise",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    features: [
      "All Pro plan features, plus...",
      "Team access & shared workspaces",
      "Private model endpoints",
      "Advanced analytics & metrics dashboard",
      "Dedicated support & onboarding",
    ],
  },
];

export const Pricing = ({ className }: { className?: string }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  const handleSubscribe = async (planName: string) => {
    if (!session) {
      router.push("/auth/login");
      return;
    }

    setLoadingPlan(planName.toLowerCase());

    try {
      const billingPeriod = isAnnual ? "yearly" : "monthly";
      const { data } = await axios.post(
        `${DOC_ROUTES.API.PAYMENT.ROOT}`,
        { billingPeriod, planName },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!data.success) {
        throw new Error(data.message || "Failed to create checkout session");
      }

      if (data.checkoutUrl) {
        // Redirect to Dodo Payments checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to process subscription. Please try again.",
      );
      setLoadingPlan(null);
    }
  };

  return (
    <section className={cn("pb-24 lg:pb-38", className)}>
      <div className="container max-w-5xl px-4">
        <motion.div
          className="space-y-4 text-center"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-2xl tracking-tight font-semibold md:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground mx-auto max-w-xl leading-snug text-balance">
            Start designing intelligent architectures for free. Upgrade for
            unlimited generations, advanced features, and seamless AI workflows
            with arcmindAI.
          </p>
        </motion.div>

        {/* Pricing Cards with animation */}
        <motion.div
          className="mt-8 grid items-start gap-5 text-start md:mt-12 md:grid-cols-3 lg:mt-20"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.15 },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.95 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.6, ease: "easeOut" },
                },
              }}
            >
              <Card
                className={cn(
                  plan.name === "Pro" &&
                    "outline-primary origin-top outline-4 shadow-lg shadow-primary/10",
                )}
              >
                <CardContent className="flex flex-col gap-7 px-6 py-5">
                  <div className="space-y-2">
                    <h3 className="text-foreground font-semibold">
                      {plan.name}
                    </h3>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-lg font-medium">
                        {isAnnual ? plan.yearlyPrice : plan.monthlyPrice}{" "}
                        {plan.name !== "Free" && plan.name !== "Enterprise" && (
                          <span className="text-muted-foreground">
                            per user/{isAnnual ? "year" : "month"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {plan.name !== "Free" && plan.name !== "Enterprise" ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isAnnual}
                        onCheckedChange={() => setIsAnnual(!isAnnual)}
                        aria-label="Toggle annual billing"
                      />
                      <span className="text-sm font-medium">
                        Billed annually
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {plan.description}
                    </span>
                  )}

                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <motion.div
                        key={feature}
                        variants={{
                          hidden: { opacity: 0, x: -10 },
                          visible: {
                            opacity: 1,
                            x: 0,
                            transition: { duration: 0.3 },
                          },
                        }}
                        className="text-muted-foreground flex items-center gap-1.5"
                      >
                        <Check className="size-5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  {plan.name === "Enterprise" ? (
                    <Link href={DOC_ROUTES.CONTACT}>
                      <Button
                        className="w-fit cursor-pointer"
                        variant="outline"
                      >
                        Contact Us
                      </Button>
                    </Link>
                  ) : plan.name === "Free" ? (
                    <Link href={DOC_ROUTES.GENERATE}>
                      <Button
                        className="w-fit cursor-pointer"
                        variant="outline"
                      >
                        Get Started
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      className="w-fit cursor-pointer"
                      variant={plan.name === "Pro" ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.name)}
                      disabled={loadingPlan === plan.name.toLowerCase()}
                    >
                      {loadingPlan === plan.name.toLowerCase() ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Subscribe ${isAnnual ? "Annually" : "Monthly"}`
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer line with animation */}
      <motion.div
        className="relative flex items-center mt-28 justify-center"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, delay: 0.2 },
          },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <DashedLine className="text-muted-foreground" />
        <span className="bg-muted text-muted-foreground absolute px-3 font-mono text-xs md:text-sm font-medium tracking-wide">
          BLUEPRINT FIRST, BUILD BETTER
        </span>
      </motion.div>
    </section>
  );
};
