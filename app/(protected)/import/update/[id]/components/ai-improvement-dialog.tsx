"use client";

import { useState } from "react";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AIImprovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCode: string;
  generationId: string;
  onImprove: (improvedCode: string) => void;
}

export function AIImprovementDialog({
  open,
  onOpenChange,
  currentCode,
  generationId,
  onImprove,
}: AIImprovementDialogProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImprove = async (useAISuggestion: boolean) => {
    // Validation: if not using AI suggestion, user prompt is required
    if (!useAISuggestion && userPrompt.trim() === "") {
      setError("This field is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        DOC_ROUTES.API.GITHUB.IMPROVE_DIAGRAM(generationId),
        {
          currentDiagram: currentCode,
          userPrompt: userPrompt.trim(),
          useAISuggestion,
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to improve diagram");
      }

      // Pass improved code back to parent
      onImprove(response.data.improvedDiagram);

      // Close dialog and reset
      onOpenChange(false);
      setUserPrompt("");
      setError(null);

      toast.success("Diagram improved successfully!");
    } catch (err) {
      console.error("Error improving diagram:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to improve diagram";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setUserPrompt("");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Improve Diagram with AI
          </DialogTitle>
          <DialogDescription>
            Provide specific instructions or let AI suggest improvements
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="prompt">
              Improvement Instructions{" "}
              <span className="text-muted-foreground text-xs">
                (optional for AI Suggest)
              </span>
            </Label>
            <Textarea
              id="prompt"
              placeholder="E.g., Add authentication layer, improve database schema, add caching layer..."
              value={userPrompt}
              onChange={(e) => {
                setUserPrompt(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              disabled={loading}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto cursor-pointer"
          >
            Cancel
          </Button>

          <div className="flex gap-2 flex-1">
            <Button
              onClick={() => handleImprove(false)}
              disabled={loading}
              className="flex-1 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update
                </>
              )}
            </Button>

            <Button
              onClick={() => handleImprove(true)}
              disabled={loading}
              variant="outline"
              className="flex-1 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suggesting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Suggest
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
