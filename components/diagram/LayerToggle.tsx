"use client";

import { useDiagram } from "@/lib/contexts/DiagramContext";
import { DiagramLayer } from "@/types/diagram";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { useEffect, useState } from "react";

export const ALL_LAYERS: DiagramLayer[] = [
  "Frontend",
  "API",
  "Database",
  "Infrastructure",
  "External",
  "Other Services",
];

interface LayerToggleProps {
  disabled?: boolean;
}

export default function LayerToggle({ disabled = false }: LayerToggleProps) {
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
    if (disabled) return;
    setActiveLayers((prev) =>
      prev.includes(layer)
        ? prev.filter((item) => item !== layer)
        : [...prev, layer],
    );
  };

  return (
    <div
      className={`absolute left-4 top-4 z-10 rounded-2xl border border-slate-800 bg-[#0f172a]/90 p-2 sm:p-3 shadow-lg backdrop-blur w-fit min-w-[160px] ${!isOpen ? "rounded-full py-2" : ""}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wide text-slate-300 hover:text-white"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Layers Filters (All)
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-slate-800">
          {ALL_LAYERS.map((layer) => (
            <label
              key={layer}
              className={`flex items-center gap-3 text-xs font-medium text-slate-400 transition-colors ${
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:text-white"
              }`}
            >
              <input
                type="checkbox"
                checked={activeLayers.includes(layer)}
                onChange={() => toggleLayer(layer)}
                disabled={disabled}
                className="h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:cursor-not-allowed"
              />
              {layer}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
