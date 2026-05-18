"use client";

import React from "react";
import { PromptTemplate } from "@/lib/prompts/templates";
import { Button } from "@/components/ui/button";

interface TemplateCardProps {
  template: PromptTemplate;
  onSelect: () => void;
}

export default function TemplateCard({
  template,
  onSelect,
}: TemplateCardProps) {
  return (
    <Button
      variant="outline"
      className="h-auto w-full flex flex-col items-start gap-1.5 p-4 text-left transition-all duration-300 hover:bg-accent hover:text-accent-foreground border-border/60 hover:border-border rounded-xl shadow-none whitespace-normal overflow-hidden"
      onClick={onSelect}
    >
      <div className="font-semibold text-[13px] leading-tight line-clamp-2 w-full">
        {template.title}
      </div>
      {template.description && (
        <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed w-full">
          {template.description}
        </div>
      )}
    </Button>
  );
}
