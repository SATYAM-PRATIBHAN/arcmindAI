import { Metadata } from "next";
import GeneratePage from "./components/GeneratePage";
import { DiagramProvider } from "@/lib/contexts/DiagramContext";

export const metadata: Metadata = {
  title: "Generate",
};
export default function Generate() {
  return (
    <DiagramProvider>
      <GeneratePage />
    </DiagramProvider>
  );
}
