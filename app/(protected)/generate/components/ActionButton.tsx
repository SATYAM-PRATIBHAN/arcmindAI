"use client";

import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";

interface ActionButtonProps {
  onClick: () => void;
}

export default function ActionButton({ onClick }: ActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="cursor-pointer mb-6 border-border/60 hover:border-border rounded-xl px-4 py-2 h-auto text-xs font-medium tracking-tight bg-card/50"
    >
      <MessageSquarePlus className="w-4 h-4 mr-2 text-muted-foreground" />
      Refine or Ask Doubt
    </Button>
  );
}
