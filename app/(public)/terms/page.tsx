import { Background } from "@/components/background";
import TermsPage from "@/components/blocks/terms";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
};

export default function Terms() {
  return (
    <Background variant="top" className="from-black/10 via-muted to-muted/80">
      <div className="flex flex-col min-h-screen items-center px-4">
        <TermsPage />
      </div>
    </Background>
  );
}
