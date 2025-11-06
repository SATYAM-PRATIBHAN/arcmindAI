"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { DOC_ROUTES } from "@/lib/routes";

const categories = [
  {
    title: "Account & Authentication",
    questions: [
      {
        question: "How do I sign up for an account?",
        answer:
          "You can sign up by providing your email and creating a password. After signing up, you'll receive an OTP for verification to activate your account.",
      },
      {
        question: "What if I didn't receive my OTP?",
        answer:
          "If you didn't receive the OTP, you can request a resend. Check your spam folder or ensure your email is correct. OTPs expire after a short time for security.",
      },
      {
        question: "How do I log in to my account?",
        answer:
          "Use your registered email and password to log in. If you've enabled two-factor authentication, you'll need to enter the OTP as well.",
      },
    ],
  },
  {
    title: "Generating System Designs",
    questions: [
      {
        question: "How does the system design generation work?",
        answer:
          "Provide a description of your system requirements, and our AI-powered tool will generate a structured system design in JSON format, including components, architecture, and more.",
      },
      {
        question: "Can I view my generation history?",
        answer:
          "Yes, logged-in users can access their generation history, which stores all previous system designs for easy reference and reuse.",
      },
      {
        question: "What technologies are used in the generations?",
        answer:
          "Generations leverage AI models like Gemini, integrated with tools like Langchain, and support technologies such as Next.js, React, MongoDB, and more as per your input.",
      },
    ],
  },
  {
    title: "Pricing & Billing",
    questions: [
      {
        question: "What are the pricing plans?",
        answer:
          "We offer tiered plans based on usage, including free tiers for basic generations and premium plans for advanced features and higher limits. Check the pricing section for details.",
      },
      {
        question: "How is billing handled?",
        answer:
          "Billing is monthly or annual, processed securely. You can manage subscriptions through your account dashboard.",
      },
      {
        question: "Is there a free trial?",
        answer:
          "Yes, new users get a free trial to generate a limited number of designs. Upgrade anytime to unlock more features.",
      },
    ],
  },
];

export const FAQ = ({
  headerTag = "h2",
  className,
  className2,
}: {
  headerTag?: "h1" | "h2";
  className?: string;
  className2?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section id="faq" className={cn("mb-8", className)} ref={ref}>
      <div className="container max-w-5xl px-4">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("mx-auto grid gap-16 lg:grid-cols-2", className2)}
        >
          {/* Header Section */}
          <div className="space-y-4">
            {headerTag === "h1" ? (
              <h1 className="text-2xl font-medium tracking-tight md:text-4xl lg:text-5xl">
                Got Questions?
              </h1>
            ) : (
              <h2 className="text-2xl font-medium tracking-tight md:text-4xl lg:text-5xl">
                Got Questions?
              </h2>
            )}
            <p className="text-muted-foreground max-w-md leading-snug lg:mx-auto">
              If you can&apos;t find what you&apos;re looking for,{" "}
              <Link
                href={DOC_ROUTES.CONTACT}
                className="underline underline-offset-4"
              >
                get in touch
              </Link>
              .
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="grid gap-6 text-start">
            {categories.map((category, index) => (
              <motion.div
                key={category.title}
                variants={fadeInUp}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                transition={{
                  delay: 0.2 + index * 0.15,
                  duration: 0.6,
                  ease: "easeOut",
                }}
              >
                <h3 className="text-muted-foreground border-b py-4">
                  {category.title}
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, i) => (
                    <AccordionItem key={i} value={`${index}-${i}`}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
