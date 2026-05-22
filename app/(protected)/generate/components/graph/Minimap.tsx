// app/(protected)/generate/components/graph/Minimap.tsx
"use client";

import React from "react";
import { GraphNode } from "../../utils/parser";
import { nodeThemes } from "./GraphUtils";

interface MinimapProps {
  nodes: GraphNode[];
  criticalNodes: Set<string>;
  heatmapMode: boolean;
  nodeDegrees: Record<string, number>;
  maxDegree: number;
  width: number;
  height: number;
}

export const Minimap: React.FC<MinimapProps> = ({
  nodes,
  criticalNodes,
  heatmapMode,
  nodeDegrees,
  maxDegree,
  width,
  height,
}) => {
  const getHeatmapColorClasses = (nodeId: string) => {
    const deg = nodeDegrees[nodeId] || 0;
    const ratio = maxDegree > 0 ? deg / maxDegree : 0;

    if (ratio >= 0.75) {
      return { border: "stroke-red-500", fill: "fill-red-500/50" };
    } else if (ratio >= 0.4) {
      return { border: "stroke-amber-500", fill: "fill-amber-500/50" };
    } else {
      return { border: "stroke-cyan-500/80", fill: "fill-cyan-500/30" };
    }
  };

  return (
    <div className="absolute bottom-6 left-6 w-[140px] h-[100px] rounded-2xl bg-slate-900/80 border border-white/5 backdrop-blur-md shadow-lg overflow-hidden flex items-center justify-center p-1 pointer-events-none select-none z-10">
      <svg className="w-full h-full opacity-60">
        {nodes.map((n) => {
          if (n.x === undefined || n.y === undefined) return null;

          // Map node x/y coordinates to the [10, 130] and [10, 90] bounds of the minimap
          const mx = (n.x / width) * 120 + 10;
          const my = (n.y / height) * 80 + 10;

          let colorInfo = {
            border: "stroke-slate-700",
            fill: "fill-slate-800",
          };

          if (heatmapMode) {
            colorInfo = getHeatmapColorClasses(n.id);
          } else {
            const theme = nodeThemes[n.type] || nodeThemes.component;
            colorInfo = {
              border: theme.border,
              fill: criticalNodes.has(n.id)
                ? "fill-amber-500/50"
                : "fill-slate-800",
            };
          }

          const isCritical = criticalNodes.has(n.id);

          return (
            <circle
              key={`mini-${n.id}`}
              cx={mx}
              cy={my}
              r={isCritical ? 4.5 : 3}
              className={`${colorInfo.border} ${colorInfo.fill}`}
            />
          );
        })}
      </svg>
      <div className="absolute top-2 left-2 text-[8px] font-semibold text-slate-500 uppercase tracking-widest pointer-events-none">
        MINIMAP
      </div>
    </div>
  );
};
export default Minimap;
