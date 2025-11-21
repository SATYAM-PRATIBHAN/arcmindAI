import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOC_ROUTES } from "@/lib/routes";
import { Background } from "@/components/background";
import { Navbar } from "@/components/blocks/navbar";
import { Footer } from "@/components/blocks/footer";

export default function PaymentSuccessPage() {
  return (
    <Background variant="top" className="from-muted/80 via-muted to-muted/80">
      <div className="flex flex-col min-h-screen justify-center items-center">
        <Navbar />
        <section className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 mt-20 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Payment Successful
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Thanks for upgrading your arcmindAI plan. Your subscription is now
              active—head back home and start generating unlimited system
              designs.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={DOC_ROUTES.HOME}>
              <Button size="lg">Return Home</Button>
            </Link>
            <Link href={DOC_ROUTES.GENERATE}>
              <Button size="lg" variant="outline">
                Start Building
              </Button>
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </Background>
  );
}
