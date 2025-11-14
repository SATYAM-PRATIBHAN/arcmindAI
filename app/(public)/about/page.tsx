import About from "@/components/blocks/about";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div>
      <About />
    </div>
  );
}
