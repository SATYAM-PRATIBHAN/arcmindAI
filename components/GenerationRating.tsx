"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationRatingProps {
  generationId: string;
  initialRating?: number | null;
}

export default function GenerationRating({
  generationId,
  initialRating = 0,
}: GenerationRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleRating = async (value: number) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/generate/${generationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save rating");
      }

      setRating(value);
    } catch (error) {
      console.error("Error saving rating:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => {
        const active = value <= (hoveredRating || rating || 0);

        return (
          <button
            key={value}
            type="button"
            disabled={loading}
            onClick={() => handleRating(value)}
            onMouseEnter={() => setHoveredRating(value)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
