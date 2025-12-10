"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Save, RotateCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { DOC_ROUTES } from "@/lib/routes";

interface EditorHeaderProps {
  userInput: string;
  hasChanges: boolean;
  saving: boolean;
  onReset: () => void;
  onSave: () => void;
}

export function EditorHeader({
  userInput,
  hasChanges,
  saving,
  onReset,
  onSave,
}: EditorHeaderProps) {
  const router = useRouter();
  return (
    <div className="flex flex-col md:flex-row justify-between w-full gap-4 md:gap-6">
      {/* Left Section */}
      <div className="flex flex-col min-w-0">
        <h1 className="text-2xl font-bold">Edit System Design</h1>
        <p className="text-muted-foreground text-sm mt-1 truncate max-w-full">
          {userInput}
        </p>
      </div>

      {/* Right Section - Buttons */}
      <div className="flex flex-wrap gap-2 justify-start md:justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(DOC_ROUTES.IMPORT.ROOT)}
          className="cursor-pointer"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Repositories
        </Button>

        <Button
          variant="outline"
          onClick={onReset}
          disabled={!hasChanges || saving}
          className="cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>

        <Button
          onClick={onSave}
          disabled={!hasChanges || saving}
          className="cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
