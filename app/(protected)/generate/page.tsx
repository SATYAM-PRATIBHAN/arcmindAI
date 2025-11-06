import { Metadata } from "next";
import GeneratePage from "./components/GeneratePage";

export const metadata: Metadata = {
  title: "Generate",
};
export default function Generate() {
  return (
    <div>
      <GeneratePage />
    </div>
  );
}
