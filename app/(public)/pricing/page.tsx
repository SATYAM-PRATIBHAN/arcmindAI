import { Background } from "@/components/background";
import { Pricing } from "@/components/blocks/pricing";
import { PricingTable } from "@/components/blocks/pricing-table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
};

const Page = () => {
  return (
    <Background variant="top" className="from-black/10 via-muted to-muted/80">
      <div className="flex flex-col min-h-screen items-center px-4">
        <Pricing className="py-28 text-center lg:pt-44 lg:pb-32" />
        <PricingTable />
      </div>
    </Background>
  );
};

export default Page;
