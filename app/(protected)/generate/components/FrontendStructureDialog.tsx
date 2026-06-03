"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Layout, Check, X } from "lucide-react";
import { BaseDialog } from "./BaseDialog";

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
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Generate Frontend Structure"
      description="This will generate the frontend structure for your system architecture. Do you want to proceed?"
      icon={<Layout className="w-6 h-6" />}
      footer={
        <>
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
        </>
      }
    />
  );
}
