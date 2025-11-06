import { Background } from "@/components/background";
import Contact from "@/components/blocks/contact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <Background variant="top" className="from-black/10 via-muted to-muted/80">
      <div className="flex items-center justify-center min-h-screen">
        <Contact />
      </div>
    </Background>
  );
}
