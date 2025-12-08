import { Background } from "@/components/background";
import { Footer } from "@/components/blocks/footer";
import { Navbar } from "@/components/blocks/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import Project",
};

export default function ImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Background variant="top" className="from-muted/80 via-muted to-muted/80">
        <Navbar />
        {children}
      </Background>
      <Footer />
    </div>
  );
}
