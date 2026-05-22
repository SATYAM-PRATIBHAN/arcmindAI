// app/(protected)/generate/components/graph/GraphNodeComponent.tsx
"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import { GraphNode } from "../../utils/parser";
import { nodeThemes, getNodeShape } from "./GraphUtils";

interface GraphNodeComponentProps {
  node: GraphNode;
  isSelected: boolean;
  isHovered: boolean;
  isCritical: boolean;
  isCyclicNode: boolean;
  isStoryCurrent: boolean;
  isInsightActive: boolean;
  insightSeverity: "critical" | "warning" | "optimization" | null;
  heatmapMode: boolean;
  heatmapTheme: {
    bg: string;
    border: string;
    text: string;
    glow: string;
  } | null;
  opacityClass: string;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const GraphNodeComponentInner: React.FC<GraphNodeComponentProps> = ({
  node,
  isSelected,
  isHovered,
  isCritical,
  isCyclicNode,
  isStoryCurrent,
  isInsightActive,
  insightSeverity,
  heatmapMode,
  heatmapTheme,
  opacityClass,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (node.x === undefined || node.y === undefined) return null;

  // Choose styling theme based on mode (Heatmap vs Standard)
  const theme =
    heatmapMode && heatmapTheme
      ? heatmapTheme
      : nodeThemes[node.type] || nodeThemes.component;

  const defaultTheme = nodeThemes[node.type] || nodeThemes.component;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      className={`cursor-pointer transition-all duration-300 ${opacityClass}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Insight Active Pulsing Ring */}
      {isInsightActive && insightSeverity && (
        <circle
          r={48}
          fill="none"
          stroke={
            insightSeverity === "critical"
              ? "#ef4444"
              : insightSeverity === "warning"
                ? "#f59e0b"
                : "#06b6d4"
          }
          strokeWidth={2}
          className="pulse-effect origin-center"
          pointerEvents="none"
        />
      )}

      {/* Golden Pulsing Ring for Critical Nodes */}
      {isCritical && !heatmapMode && !isStoryCurrent && !isInsightActive && (
        <circle
          r={47}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1.5}
          className="pulse-effect origin-center opacity-65"
          pointerEvents="none"
        />
      )}

      {/* Story Mode Pulsing Ring */}
      {isStoryCurrent && (
        <circle
          r={47}
          fill="none"
          stroke="#818cf8"
          strokeWidth={2}
          className="pulse-effect origin-center"
          pointerEvents="none"
        />
      )}

      {/* Standard Pulsing Ring on selection or hover */}
      {(isSelected || isHovered) && !isStoryCurrent && !isInsightActive && (
        <circle
          r={45}
          fill="none"
          stroke={isSelected ? "#6366f1" : "#06b6d4"}
          strokeWidth={1.5}
          className="pulse-effect origin-center"
          pointerEvents="none"
        />
      )}

      {/* Glowing shadow filters under nodes */}
      <g
        className={
          isSelected || isHovered
            ? theme.glow
            : isCritical && !heatmapMode
              ? "drop-shadow-[0_0_10px_rgba(245,158,11,0.55)]"
              : ""
        }
      >
        {getNodeShape(node.type)}
      </g>

      {/* Inside Shape Styling */}
      <g
        className={`${theme.bg} ${
          isCritical && !heatmapMode
            ? "stroke-amber-500 stroke-[2px]"
            : theme.border
        } transition-all duration-300`}
      >
        {/* Critical visual badge inset */}
        {isCritical && !heatmapMode && (
          <circle
            cx={42}
            cy={-14}
            r={4}
            className="fill-amber-500 stroke-none"
          />
        )}
      </g>

      {/* Node Text & Type Icon */}
      <g transform="translate(0, 0)">
        <g transform="translate(0, -10)">
          {isCyclicNode && !isStoryCurrent ? (
            <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          ) : isCritical && !heatmapMode && !isHovered && !isSelected ? (
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          ) : (
            defaultTheme.icon
          )}
        </g>
        <text
          y={12}
          textAnchor="middle"
          className={`${theme.text} font-bold text-[10px] tracking-wide pointer-events-none select-none`}
        >
          {node.label.length > 18
            ? `${node.label.slice(0, 16)}...`
            : node.label}
        </text>
      </g>
    </g>
  );
};

// Custom comparison for memoization performance boost
export const GraphNodeComponent = React.memo(
  GraphNodeComponentInner,
  (prevProps, nextProps) => {
    return (
      prevProps.node.x === nextProps.node.x &&
      prevProps.node.y === nextProps.node.y &&
      prevProps.node.fx === nextProps.node.fx &&
      prevProps.node.fy === nextProps.node.fy &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isHovered === nextProps.isHovered &&
      prevProps.isCritical === nextProps.isCritical &&
      prevProps.isCyclicNode === nextProps.isCyclicNode &&
      prevProps.isStoryCurrent === nextProps.isStoryCurrent &&
      prevProps.isInsightActive === nextProps.isInsightActive &&
      prevProps.insightSeverity === nextProps.insightSeverity &&
      prevProps.heatmapMode === nextProps.heatmapMode &&
      prevProps.opacityClass === nextProps.opacityClass &&
      prevProps.heatmapTheme?.bg === nextProps.heatmapTheme?.bg &&
      prevProps.heatmapTheme?.border === nextProps.heatmapTheme?.border
    );
  },
);

export default GraphNodeComponent;
