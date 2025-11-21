"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <Card className="p-4">
      <label className="block text-sm font-medium mb-2">Update Response</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={responseText}
          onChange={(e) => onResponseTextChange(e.target.value)}
          placeholder="Type something to update..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
          disabled={isUpdating}
        />
        <Button
          onClick={onUpdate}
          disabled={!responseText.trim() || isUpdating}
          className="cursor-pointer"
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </div>
      {error && (
        <CardContent className="pt-4">
          <p className="text-red-600 text-sm">{error}</p>
        </CardContent>
      )}
    </Card>
  );
}
