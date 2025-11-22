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

interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUpdate: () => void;
  onSelectDoubt: () => void;
  onCancel: () => void;
}

export default function ActionDialog({
  open,
  onOpenChange,
  onSelectUpdate,
  onSelectDoubt,
  onCancel,
}: ActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Action</DialogTitle>
          <DialogDescription>
            Choose whether to update response or ask a doubt.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <Button
            variant="default"
            onClick={onSelectUpdate}
            className="cursor-pointer w-full"
          >
            Update Response
          </Button>
          <Button
            variant="default"
            onClick={onSelectDoubt}
            className="cursor-pointer w-full"
          >
            Ask Doubt
          </Button>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
