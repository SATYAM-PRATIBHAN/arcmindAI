"use client";

import React, { useState, useRef } from "react";
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
 * - Shrinks to icon on mobile if unfocused and empty
 */
export const FloatingSearch: React.FC<FloatingSearchProps> = React.memo(
  function FloatingSearch({ position = "left", className }) {
    const { searchQuery, setSearchQuery } = useDiagram();
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
      },
      [setSearchQuery],
    );

    const isExpanded = isFocused || !!searchQuery;

    return (
      <div
        className={
          "absolute top-4 z-20 flex items-center gap-2 p-2 rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm shadow-sm transition-all duration-300 overflow-hidden " +
          (isExpanded
            ? "w-[calc(100%-10rem)] sm:w-80 "
            : "w-10 sm:w-80 cursor-pointer ") +
          (position === "left" ? "left-4" : "right-4") +
          (className ? ` ${className}` : "")
        }
        role="search"
        aria-label="Search diagram"
        onClick={() => {
          if (!isExpanded) {
            inputRef.current?.focus();
          }
        }}
      >
        <Search className="w-5 h-5 ml-0.5 text-muted-foreground shrink-0" />
        <Input
          ref={inputRef}
          id="diagram-search"
          placeholder="Search components..."
          value={searchQuery}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`flex-1 min-w-0 !p-1 !pl-0 bg-transparent border-0 shadow-none transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0 sm:opacity-100"}`}
          aria-label="Search components or nodes"
        />
      </div>
    );
  },
);

export default FloatingSearch;
