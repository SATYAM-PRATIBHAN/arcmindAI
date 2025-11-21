"use client";

import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  onClick: () => void;
}

export default function ActionButton({ onClick }: ActionButtonProps) {
  return (
    <Button onClick={onClick} className="cursor-pointer mb-4">
      Update / Ask Doubt
    </Button>
  );
}
