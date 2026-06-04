"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/blocks/navbar";
import { Footer } from "@/components/blocks/footer";
import { DOC_ROUTES } from "@/lib/routes";
import NotFoundAnimation from "@/components/NotFoundAnimation";

export default function NotFound() {
  return (
    <div>
      <Background variant="top" className="from-muted/80 via-muted to-muted/80">
        <div className="flex flex-col min-h-screen justify-center items-center">
          <Navbar />
          <div className="container flex min-h-[70vh] flex-col items-center justify-center py-28 text-center lg:min-h-[80vh] lg:py-32">
            {/* Lottie Animation Center */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <NotFoundAnimation />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 max-w-2xl"
            >
              <p className="font-serif italic text-muted-foreground mb-10 text-xl">
                Sorry, we couldn&apos;t find the page you&apos;re looking for.
                The page might have been removed or the URL might be incorrect.
              </p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
              >
                <Button asChild size="lg" className="group min-w-[200px] gap-2" aria-label="Return Home">
                  <Link href={DOC_ROUTES.HOME} aria-label="Return Home">
                    <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" />
                    Back to Home
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="min-w-[200px]"
                >
                  <Link href={DOC_ROUTES.CONTACT}>Contact Support</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </Background>

      <Footer />
    </div>
  );
}
