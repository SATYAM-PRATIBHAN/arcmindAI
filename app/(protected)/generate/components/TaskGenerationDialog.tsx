"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface TaskGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generationId: string;
}

export default function TaskGenerationDialog({
  open,
  onOpenChange,
  generationId,
}: TaskGenerationDialogProps) {
  const router = useRouter();

  const handleConfirm = () => {
    router.push(`/generate/${generationId}/tasks`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Task Breakdown</DialogTitle>
          <DialogDescription>
            This will generate a detailed task breakdown for your system
            architecture. Do you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            className="w-full sm:w-auto cursor-pointer"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
