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
import { Layout, Check, X } from "lucide-react";

interface FrontendStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generationId: string;
}

export default function FrontendStructureDialog({
  open,
  onOpenChange,
  generationId,
}: FrontendStructureDialogProps) {
  const router = useRouter();

  const handleConfirm = () => {
    router.push(`/generate/${generationId}/frontendStructure`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/60 rounded-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
            <Layout className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-center">
            Generate Frontend Structure
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-center">
            This will generate the frontend structure for your system
            architecture. Do you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:flex-1 rounded-xl border-border/40 hover:bg-accent/50 transition-all duration-300"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            className="w-full sm:flex-1 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 active:scale-95"
          >
            <Check className="w-4 h-4 mr-2" />
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
