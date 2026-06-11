"use client";

import { useState, useEffect } from "react";
import { useDiagram } from "@/lib/contexts/DiagramContext";
import { DiagramLayer } from "@/types/diagram";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";

const layers: DiagramLayer[] = [
  "Frontend",
  "API",
  "Database",
  "Infrastructure",
  "External",
  "Other Services",
];

export default function LayerToggle() {
  const { activeLayers, setActiveLayers } = useDiagram();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open on desktop, close on mobile
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.innerWidth >= 640) {
        setIsOpen(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleLayer = (layer: DiagramLayer) => {
    setActiveLayers((prev) =>
      prev.includes(layer)
        ? prev.filter((item) => item !== layer)
        : [...prev, layer],
    );
  };

  return (
    <div className="absolute left-4 top-20 z-10 rounded-xl border border-border/40 bg-background/70 p-2 sm:p-3 shadow-sm backdrop-blur w-fit min-w-[140px]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5" />
          Layers
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {isOpen && (
        <div className="flex flex-col gap-2 mt-3">
          {layers.map((layer) => (
            <label
              key={layer}
              className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <input
                type="checkbox"
                checked={activeLayers.includes(layer)}
                onChange={() => toggleLayer(layer)}
                className="h-3.5 w-3.5 shrink-0"
              />
              {layer}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
