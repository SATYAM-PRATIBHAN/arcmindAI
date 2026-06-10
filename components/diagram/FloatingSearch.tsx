"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDiagram } from "@/lib/contexts/DiagramContext";

type FloatingSearchProps = {
  position?: "left" | "right";
  className?: string;
};

/**
 * FloatingSearch
 * A small, reusable floating search input that lives above the diagram canvas.
 * - Controlled by `DiagramContext.searchQuery`
 * - Updates `setSearchQuery` on every change
 */
export const FloatingSearch: React.FC<FloatingSearchProps> = React.memo(
  function FloatingSearch({ position = "left", className }) {
    const { searchQuery, setSearchQuery } = useDiagram();

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
      },
      [setSearchQuery],
    );

    return (
      <div
        className={
          "absolute top-4 z-20 flex items-center gap-2 p-2 rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm shadow-sm max-w-[min(60ch,90%)] " +
          (position === "left" ? "left-4" : "right-4") +
          (className ? ` ${className}` : "")
        }
        role="search"
        aria-label="Search diagram"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          id="diagram-search"
          placeholder="Search services, components, or nodes..."
          value={searchQuery}
          onChange={handleChange}
          className="flex-1 min-w-0 !p-1 !pl-0 bg-transparent border-0 shadow-none"
          aria-label="Search services, components, or nodes"
        />
      </div>
    );
  },
);

export default FloatingSearch;
