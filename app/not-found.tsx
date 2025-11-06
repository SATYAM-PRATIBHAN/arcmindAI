import Link from "next/link";

import { ArrowLeft } from "lucide-react";
import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/blocks/navbar";
import { Footer } from "@/components/blocks/footer";
import { DOC_ROUTES } from "@/lib/routes";

export default function NotFound() {
  return (
    <div>
      <Background variant="top" className="from-muted/80 via-muted to-muted/80">
        <div className="flex flex-col min-h-screen justify-center items-center">
          <Navbar />
          <div className="container flex min-h-[70vh] flex-col items-center justify-center py-28 text-center lg:min-h-[80vh] lg:py-32">
            <div className="relative z-10 max-w-2xl">
              <h1 className="from-foreground to-foreground/70 relative mb-6 bg-linear-to-br bg-clip-text py-2 text-5xl font-bold text-transparent sm:text-6xl lg:text-7xl">
                Page Not Found
              </h1>

              <p className="text-muted-foreground mb-10 text-xl">
                Sorry, we couldn&apos;t find the page you&apos;re looking for.
                The page might have been removed or the URL might be incorrect.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
              </div>
            </div>
          </div>
        </div>
      </Background>
      <Footer />
    </div>
  );
}
