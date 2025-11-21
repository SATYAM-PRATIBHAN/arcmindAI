"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DOC_ROUTES } from "@/lib/routes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelSubscriptionDialog({ open, onOpenChange }: Props) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Cancel Subscription?
          </DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-sm">
          Are you sure you want to cancel your subscription? You will lose
          access to all Pro features at the end of your billing period.
        </p>

        <DialogFooter className="flex justify-end gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Close
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              router.push(`${DOC_ROUTES.PROFILE.CANCEL_SUBSCRIPTION}`);
              onOpenChange(false);
            }}
            className="cursor-pointer"
          >
            Confirm Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
