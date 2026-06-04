import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { DOC_ROUTES } from "@/lib/routes";

interface GuestLimitCardProps {
  setIsGuestPromptOpen: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function GuestLimitCard({
  setIsGuestPromptOpen,
  title = "Guest mode limit reached",
  description = "Sign up to save your architecture history and continue generating."
}: GuestLimitCardProps) {
  return (
    <Card className="border-border/60 bg-card/40 rounded-2xl shadow-sm">
      <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            {title}
          </p>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setIsGuestPromptOpen(true)}
          >
            View Benefits
          </Button>
          <Button className="rounded-xl" asChild aria-label="Create Free Account">
            <Link href={DOC_ROUTES.AUTH.SIGN_UP} aria-label="Create Free Account">
              Create Free Account
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
