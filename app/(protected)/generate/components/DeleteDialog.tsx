"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle, X } from "lucide-react";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export default function DeleteDialog({
  open,
  onOpenChange,
  onDelete,
  isDeleting,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="cursor-pointer h-10 px-6 rounded-xl transition-all duration-300 active:scale-95 shadow-md shadow-destructive/10"
          variant="destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Generation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-border/60 rounded-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-center">
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-center">
            Are you sure you want to delete this generation? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-3 mt-4">
          <Button
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="w-full sm:flex-1 rounded-xl border-border/40 hover:bg-accent/50 transition-all duration-300"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting}
            className="w-full sm:flex-1 rounded-xl shadow-lg shadow-destructive/20 transition-all duration-300 active:scale-95"
          >
            {isDeleting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            {isDeleting ? "Deleting..." : "Confirm Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
