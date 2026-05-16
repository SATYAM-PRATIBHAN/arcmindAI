"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationRatingProps {
  generationId: string;
  initialRating?: number | null;
  className?: string;
}

export function GenerationRating({
  generationId,
  initialRating = null,
  className,
}: GenerationRatingProps) {
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(!!initialRating);
  const [error, setError] = useState<string | null>(null);

  const handleRate = async (value: number) => {
    // Allow un-rating by clicking the same star
    if (rating === value) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/generation/${generationId}/rating`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save rating");
      }

      setRating(value);
      setSaved(true);

      // Clear "Saved!" feedback after 2 seconds
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const activeValue = hovered ?? rating;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
        Rate this design
      </p>

      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Rate this generation"
        onMouseLeave={() => setHovered(null)}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={loading}
            aria-label={`Rate ${value} out of 5`}
            aria-pressed={rating === value}
            onClick={() => handleRate(value)}
            onMouseEnter={() => setHovered(value)}
            className={cn(
              "group relative p-1 rounded-md transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "hover:scale-110 active:scale-95"
            )}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors duration-150",
                activeValue !== null && value <= activeValue
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground group-hover:text-amber-300"
              )}
            />
          </button>
        ))}

        {/* Feedback text */}
        <span
          className={cn(
            "ml-2 text-xs transition-all duration-300",
            saved
              ? "text-emerald-500 opacity-100"
              : error
              ? "text-destructive opacity-100"
              : loading
              ? "text-muted-foreground opacity-100"
              : "opacity-0"
          )}
        >
          {loading ? "Saving…" : saved ? "✓ Saved!" : error ?? ""}
        </span>
      </div>

      {rating !== null && !loading && (
        <p className="text-xs text-muted-foreground">
          {ratingLabel(rating)}
        </p>
      )}
    </div>
  );
}

function ratingLabel(rating: number): string {
  switch (rating) {
    case 1: return "Not useful";
    case 2: return "Needs improvement";
    case 3: return "Decent";
    case 4: return "Great design!";
    case 5: return "Perfect — exactly what I needed!";
    default: return "";
  }
}