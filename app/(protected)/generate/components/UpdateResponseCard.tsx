"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCcw, AlertCircle } from "lucide-react";

interface UpdateResponseCardProps {
  responseText: string;
  onResponseTextChange: (text: string) => void;
  onUpdate: () => void;
  isUpdating: boolean;
  error?: string | null;
}

export default function UpdateResponseCard({ 
  responseText,
  onResponseTextChange,
  onUpdate,
  isUpdating,
  error,
}: UpdateResponseCardProps) {
  return (
    <Card className="p-6 border-border/60 bg-card/50 backdrop-blur-sm rounded-2xl mb-8 shadow-xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCcw
            className={`w-4 h-4 text-muted-foreground ${isUpdating ? "animate-spin" : ""}`}
          />
          <p className="text-sm font-bold tracking-tight">
            Refine Architecture
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={responseText}
            onChange={(e) => onResponseTextChange(e.target.value)}
            placeholder="E.g., 'Add a Redis cache for session management'..."
            className="flex-1 rounded-xl bg-accent/20 border-border/40 focus-visible:ring-1 focus-visible:ring-foreground/20 h-11"
            disabled={isUpdating}
          />
          <Button
            onClick={onUpdate}
            disabled={!responseText.trim() || isUpdating}
            className="rounded-xl px-8 h-11 transition-all duration-300 active:scale-95 shrink-0"
          >
            {isUpdating ? "Updating..." : "Apply Update"}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-1">
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            <p className="text-[11px] text-destructive/80">{error}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
