"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { DOC_ROUTES } from "@/lib/routes";

interface SignUpPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SignUpPromptDialog({
  open,
  onOpenChange,
}: SignUpPromptDialogProps) {
  const router = useRouter();

  const handleAction = (path: string) => {
    onOpenChange(false);
    router.push(`${path}?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 border-border/80 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden p-8 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Sparkles Decorative Icon */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Sparkles className="w-8 h-8" />
            <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full"></div>
          </div>

          <div className="space-y-2">
            <DialogTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-muted-foreground to-foreground bg-clip-text text-transparent">
              Save Your Architecture!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base leading-relaxed px-2">
              Your guest architecture was generated successfully! Create a free account now to save this design, export the Mermaid diagram, break down developer tasks, and enjoy unlimited systems.
            </DialogDescription>
          </div>

          {/* Quick Stats or Value Props */}
          <div className="grid grid-cols-2 gap-4 w-full bg-muted/40 border border-border/40 rounded-2xl p-4 text-xs font-medium text-muted-foreground">
            <div className="flex flex-col items-center justify-center p-2 text-center border-r border-border/40">
              <span className="text-lg font-bold text-foreground mb-1">💾 Save</span>
              Permanent History
            </div>
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <span className="text-lg font-bold text-foreground mb-1">💡 Ask AI</span>
              Doubt Chat Enabled
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full pt-2">
            <Button
              onClick={() => handleAction(DOC_ROUTES.AUTH.SIGN_UP)}
              size="lg"
              className="cursor-pointer w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl hover:bg-primary/95 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Create Free Account
            </Button>
            <Button
              onClick={() => handleAction(DOC_ROUTES.AUTH.LOGIN)}
              variant="outline"
              size="lg"
              className="cursor-pointer w-full border-border/60 text-foreground font-medium py-4 rounded-xl hover:bg-muted/50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Log In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
