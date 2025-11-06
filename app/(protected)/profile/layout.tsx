import { Footer } from "@/components/blocks/footer";
import { Navbar } from "@/components/blocks/navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
