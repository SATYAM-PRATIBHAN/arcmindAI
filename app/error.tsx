"use client";

import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { ArrowLeft } from "lucide-react";
import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/blocks/navbar";
import { Footer } from "@/components/blocks/footer";
import { DOC_ROUTES } from "@/lib/routes";
import { motion } from "framer-motion";

export default function Error() {
  return (
    <div>
      <Background variant="top" className="from-muted/80 via-muted to-muted/80">
        <div className="flex flex-col min-h-screen justify-center items-center">
          <Navbar />

          <div className="container flex flex-col items-center justify-center py-24 text-center lg:py-28">
            {/* Lottie animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80">
                <DotLottieReact
                  src="https://lottie.host/e22a0b5a-8499-4284-a439-4fbefc3e1511/HXZheRECtt.lottie"
                  loop
                  autoplay
                />
              </div>
            </motion.div>

            {/* Text section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl"
            >
              <p className="font-serif italic text-muted-foreground mt-6 mb-10 text-xl">
                Something broke inside the system. Our AI services are currently
                recovering from an unexpected failure.
              </p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
              >
                <Button asChild size="lg" className="group min-w-[200px] gap-2">
                  <Link href={DOC_ROUTES.HOME}>
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
