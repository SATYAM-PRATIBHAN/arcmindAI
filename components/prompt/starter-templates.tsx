"use client";

import { getTemplates } from "@/lib/prompts/templates";
import TemplateCard from "./template-card";
import { Sparkles } from "lucide-react";

interface StarterTemplatesProps {
  onSelectTemplate: (templateBody: string) => void;
  isVisible: boolean;
}

export default function StarterTemplates({
  onSelectTemplate,
  isVisible,
}: StarterTemplatesProps) {
  const templates = getTemplates();

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-full bg-card/50 rounded-xl p-6 border border-border/50">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Quick Start Templates
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelectTemplate(template.body)}
          />
        ))}
      </div>
    </div>
  );
}
