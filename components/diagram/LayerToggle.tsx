"use client";

import { useDiagram } from "@/lib/contexts/DiagramContext";
import { DiagramLayer } from "@/types/diagram";

const layers: DiagramLayer[] = [
  "Frontend",
  "API",
  "Database",
  "Infrastructure",
  "External",
  "Unknown",
];

export default function LayerToggle() {
  const { activeLayers, setActiveLayers } = useDiagram();

  const toggleLayer = (layer: DiagramLayer) => {
    setActiveLayers((prev) =>
      prev.includes(layer)
        ? prev.filter((item) => item !== layer)
        : [...prev, layer],
    );
  };

  return (
    <div className="absolute left-4 top-16 z-10 rounded-xl border border-border/40 bg-background/70 p-3 shadow-sm backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Layers
      </p>

      <div className="flex flex-col gap-2">
        {layers.map((layer) => (
          <label
            key={layer}
            className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <input
              type="checkbox"
              checked={activeLayers.includes(layer)}
              onChange={() => toggleLayer(layer)}
              className="h-3.5 w-3.5"
            />
            {layer}
          </label>
        ))}
      </div>
    </div>
  );
}
