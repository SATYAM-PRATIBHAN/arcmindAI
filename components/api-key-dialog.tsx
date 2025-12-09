"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ApiKeyDialog({
  isOpen,
  onClose,
  onSuccess,
}: ApiKeyDialogProps) {
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!geminiKey && !openaiKey) {
      toast.error("Please provide at least one API key");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          geminiApiKey: geminiKey || undefined,
          openaiApiKey: openaiKey || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save API keys");
      }

      toast.success("API keys saved successfully! 🎉");
      setGeminiKey("");
      setOpenaiKey("");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save API keys",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveKeys = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/api-keys?provider=all", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove API keys");
      }

      toast.success("API keys removed successfully");
      setGeminiKey("");
      setOpenaiKey("");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error removing API keys:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove API keys",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Your Personal API Keys</DialogTitle>
          <DialogDescription>
            We&apos;re having trouble with our API keys. You can add your own to
            continue generating. Your keys will be encrypted and stored
            securely.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">
              Gemini API Key{" "}
              <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="gemini-key"
              type="password"
              placeholder="AIza..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Get your key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai-key">
              OpenAI API Key{" "}
              <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Get your key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || (!geminiKey && !openaiKey)}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save API Keys"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveKeys}
              disabled={isLoading}
            >
              Remove Keys
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your API keys are encrypted before storage. We never share them with
            third parties.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
