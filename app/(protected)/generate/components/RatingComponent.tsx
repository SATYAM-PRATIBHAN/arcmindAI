import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RatingComponentProps {
  generationId: string;
  initialRating?: number | null;
}

export function RatingComponent({ generationId, initialRating }: RatingComponentProps) {
  const [rating, setRating] = useState<number | null>(initialRating || null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = async (value: number) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const previousRating = rating;
    setRating(value); // Optimistic UI update
    
    try {
      const response = await fetch(`/api/generate/${generationId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating: value }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit rating");
      }
      
      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit rating");
      setRating(previousRating); // Revert on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <span className="text-sm text-gray-500 mr-2">Rate this generation:</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={isSubmitting}
          onClick={() => handleRating(star)}
          onMouseEnter={() => setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(null)}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm disabled:opacity-50 transition-colors"
          aria-label={`Rate ${star} out of 5 stars`}
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              (hoveredRating !== null ? star <= hoveredRating : rating !== null && star <= rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
