import { Background } from "@/components/background";
import PrivacyPage from "@/components/blocks/privacy";

export default function Privacy() {
  return (
    <Background variant="top" className="from-black/10 via-muted to-muted/80">
      <div className="flex flex-col min-h-screen items-center px-4">
        <PrivacyPage />
      </div>
    </Background>
  );
}
