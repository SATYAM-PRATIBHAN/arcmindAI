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
import { RefreshCcw, MessageCircle, X } from "lucide-react";

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
      <DialogContent className="sm:max-w-md border-border/60 rounded-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Refine Architecture
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            How would you like to interact with this generation?
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 py-6">
          <Button
            variant="outline"
            onClick={onSelectUpdate}
            className="group flex items-center justify-start gap-4 h-auto p-4 rounded-xl border-border/40 hover:border-border transition-all duration-300 bg-accent/20"
          >
            <div className="p-2 bg-foreground text-background rounded-lg group-hover:scale-110 transition-transform duration-300">
              <RefreshCcw className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Update Response</p>
              <p className="text-[11px] text-muted-foreground">
                Modify parts of the system design
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={onSelectDoubt}
            className="group flex items-center justify-start gap-4 h-auto p-4 rounded-xl border-border/40 hover:border-border transition-all duration-300 bg-accent/20"
          >
            <div className="p-2 bg-foreground text-background rounded-lg group-hover:scale-110 transition-transform duration-300">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Ask Doubt</p>
              <p className="text-[11px] text-muted-foreground">
                Get clarification on specific components
              </p>
            </div>
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-2" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
