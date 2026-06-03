"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw, MessageCircle, X } from "lucide-react";
import { BaseDialog } from "./BaseDialog";

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
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Refine Architecture"
      description="How would you like to interact with this generation?"
      footer={
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="w-3 h-3 mr-2" />
          Cancel
        </Button>
      }
    >
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
    </BaseDialog>
  );
}
