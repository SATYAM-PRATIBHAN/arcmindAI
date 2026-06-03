"use client";

import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { BaseDialog } from "./BaseDialog";

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
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Confirm Deletion"
      description="Are you sure you want to delete this generation? This action cannot be undone."
      icon={<AlertTriangle className="w-6 h-6" />}
      trigger={
        <Button
          className="cursor-pointer h-10 px-6 rounded-xl transition-all duration-300 active:scale-95 shadow-md shadow-destructive/10"
          variant="destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Generation
        </Button>
      }
      footer={
        <>
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
        </>
      }
    >
    </BaseDialog>
  );
}
