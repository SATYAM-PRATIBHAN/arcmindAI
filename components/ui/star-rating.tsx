"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number | null;
  maxRating?: number;
  onRate?: (rating: number) => void;
  disabled?: boolean;
  size?: number;
  className?: string;
}

export default function StarRating({
  rating = 0,
  maxRating = 5,
  onRate,
  disabled = false,
  size = 18,
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;

        return (
          <button
            key={starValue}
            type="button"
            disabled={disabled}
            onClick={() => onRate?.(starValue)}
            className={cn(
              "transition-transform duration-150",
              !disabled && "hover:scale-110",
              disabled && "cursor-not-allowed opacity-70",
            )}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors duration-150",
                starValue <= (rating ?? 0)
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
