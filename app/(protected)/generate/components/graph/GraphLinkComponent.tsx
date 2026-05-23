// app/(protected)/generate/components/graph/GraphLinkComponent.tsx
"use client";

import React from "react";
import { GraphLink, GraphNode } from "../../utils/parser";

interface SystemInsight {
  id: string;
  type: string;
  severity: "critical" | "warning" | "optimization";
  title: string;
  description: string;
  affectedNodes: string[];
  affectedLinks: string[];
}

interface GraphLinkComponentProps {
  link: GraphLink;
  source: GraphNode;
  target: GraphNode;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  traceDirection: "none" | "upstream" | "downstream" | "full";
  tracePaths: { upstream: Set<string>; downstream: Set<string> } | null;
  storyActiveInfo: {
    activeNodeIds: Set<string>;
    currentNodeId: string | null;
    activeLinks: Set<string>;
    currentIncomingLinkKey: string | null;
  } | null;
  selectedInsight: SystemInsight | null;
  isStoryMode: boolean;
}

const GraphLinkComponentInner: React.FC<GraphLinkComponentProps> = ({
  link,
  source,
  target,
  selectedNodeId,
  hoveredNodeId,
  traceDirection,
  tracePaths,
  storyActiveInfo,
  selectedInsight,
  isStoryMode,
}) => {
  const [isLinkHovered, setIsLinkHovered] = React.useState(false);

  if (
    source.x === undefined ||
    source.y === undefined ||
    target.x === undefined ||
    target.y === undefined
  ) {
    return null;
  }

  // Trace calculations: Is this link upstream or downstream?
  const isSelectedNode =
    selectedNodeId &&
    (source.id === selectedNodeId || target.id === selectedNodeId);

  const isUpstreamLink =
    selectedNodeId &&
    (traceDirection === "full" || traceDirection === "upstream") &&
    tracePaths?.upstream.has(source.id) &&
    (tracePaths?.upstream.has(target.id) || target.id === selectedNodeId);

  const isDownstreamLink =
    selectedNodeId &&
    (traceDirection === "full" || traceDirection === "downstream") &&
    tracePaths?.downstream.has(target.id) &&
    (tracePaths?.downstream.has(source.id) || source.id === selectedNodeId);

  const isTraceConnection =
    isUpstreamLink || isDownstreamLink || isSelectedNode;

  // Story active links
  const isStoryActiveLink =
    storyActiveInfo &&
    storyActiveInfo.activeLinks.has(`${source.id}->${target.id}`);
  const isStoryIncomingLink =
    storyActiveInfo &&
    storyActiveInfo.currentIncomingLinkKey === `${source.id}->${target.id}`;

  // Insight active links
  const isInsightLink =
    selectedInsight &&
    selectedInsight.affectedLinks.includes(`${source.id}->${target.id}`);

  const isUnrelatedLink = isStoryMode
    ? !isStoryActiveLink
    : selectedInsight
      ? !isInsightLink
      : selectedNodeId && !isTraceConnection;

  // Right-angle (orthogonal) routing calculations (vertical-first flow)
  const midY = source.y + (target.y - source.y) / 2;
  const pathData = `M ${source.x} ${source.y} V ${midY} H ${target.x} V ${target.y}`;

  // Link styling based on trace / active state
  let strokeColor = "#475569";
  let markerId = "arrow";
  if (isStoryMode) {
    if (isStoryActiveLink) {
      strokeColor = "#818cf8"; // Story Active path color (Indigo)
      markerId = "arrow-active";
    }
  } else if (selectedInsight) {
    if (isInsightLink) {
      strokeColor =
        selectedInsight.severity === "critical" ? "#ef4444" : "#f59e0b";
      markerId =
        selectedInsight.severity === "critical"
          ? "arrow-trace-upstream"
          : "arrow-trace-downstream";
    }
  } else if (selectedNodeId) {
    if (isUpstreamLink) {
      strokeColor = "#ef4444"; // Upstream Red
      markerId = "arrow-trace-upstream";
    } else if (isDownstreamLink) {
      strokeColor = "#06b6d4"; // Downstream Cyan
      markerId = "arrow-trace-downstream";
    } else if (isSelectedNode) {
      strokeColor = "#6366f1"; // Primary Selection
      markerId = "arrow-active";
    }
  }

  // Hover states: display labels if link is hovered or either connected node is hovered/selected
  const isNodeHovered =
    hoveredNodeId === source.id || hoveredNodeId === target.id;
  const isNodeSelected =
    selectedNodeId === source.id || selectedNodeId === target.id;
  const shouldShowLabel = isLinkHovered || isNodeHovered || isNodeSelected;

  return (
    <g
      className={`transition-opacity duration-300 ${
        isUnrelatedLink ? "opacity-10" : "opacity-100"
      }`}
    >
      {/* Invisible thicker interaction path for easier mouse hover selection */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        className="cursor-pointer"
        onMouseEnter={() => setIsLinkHovered(true)}
        onMouseLeave={() => setIsLinkHovered(false)}
      />

      {/* Main visible connection line */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isTraceConnection ? 2.5 : 1.5}
        className="transition-all duration-300"
        markerEnd={`url(#${markerId})`}
      />

      {/* Animated flow dash trace */}
      {((!isStoryMode &&
        !selectedInsight &&
        (!selectedNodeId || isTraceConnection)) ||
        (isStoryMode && isStoryActiveLink) ||
        (selectedInsight && isInsightLink)) && (
        <path
          d={pathData}
          fill="none"
          stroke={
            isStoryMode
              ? "#c7d2fe"
              : selectedInsight
                ? selectedInsight.severity === "critical"
                  ? "#fca5a5"
                  : "#fcd34d"
                : isUpstreamLink
                  ? "#fca5a5"
                  : isDownstreamLink
                    ? "#67e8f9"
                    : isSelectedNode
                      ? "#a5b4fc"
                      : "#94a3b8"
          }
          strokeWidth={
            isStoryMode || selectedInsight || isTraceConnection ? 1.5 : 1
          }
          strokeDasharray="5,15"
          strokeDashoffset={0}
          className="animate-flow-line opacity-75"
          pointerEvents="none"
        />
      )}

      {/* Animated packet flow particle (Phase 4 & 5) */}
      {isStoryMode && isStoryIncomingLink && (
        <circle
          r={5.5}
          className="fill-indigo-400 filter drop-shadow-[0_0_8px_#6366f1]"
        >
          <animateMotion dur="1.8s" repeatCount="indefinite" path={pathData} />
        </circle>
      )}

      {selectedInsight && isInsightLink && (
        <circle
          r={4.5}
          className={
            selectedInsight.severity === "critical"
              ? "fill-red-400 filter drop-shadow-[0_0_6px_#ef4444]"
              : "fill-amber-400 filter drop-shadow-[0_0_6px_#f59e0b]"
          }
        >
          <animateMotion dur="2s" repeatCount="indefinite" path={pathData} />
        </circle>
      )}

      {/* Hover-only glassmorphic link labels */}
      {link.label && shouldShowLabel && (
        <g transform={`translate(${(source.x + target.x) / 2}, ${midY})`}>
          <rect
            x={-42}
            y={-9}
            width={84}
            height={18}
            rx={5}
            className="fill-slate-950/85 stroke-indigo-500/25 stroke-[1px] backdrop-blur-md"
          />
          <text
            textAnchor="middle"
            alignmentBaseline="middle"
            className="fill-slate-300 font-semibold text-[8.5px] select-none pointer-events-none"
          >
            {link.label.length > 15
              ? `${link.label.slice(0, 13)}...`
              : link.label}
          </text>
        </g>
      )}
    </g>
  );
};

export const GraphLinkComponent = React.memo(
  GraphLinkComponentInner,
  (prevProps, nextProps) => {
    return (
      prevProps.link.label === nextProps.link.label &&
      prevProps.source.x === nextProps.source.x &&
      prevProps.source.y === nextProps.source.y &&
      prevProps.target.x === nextProps.target.x &&
      prevProps.target.y === nextProps.target.y &&
      prevProps.selectedNodeId === nextProps.selectedNodeId &&
      prevProps.hoveredNodeId === nextProps.hoveredNodeId &&
      prevProps.traceDirection === nextProps.traceDirection &&
      prevProps.isStoryMode === nextProps.isStoryMode &&
      prevProps.tracePaths?.upstream === nextProps.tracePaths?.upstream &&
      prevProps.tracePaths?.downstream === nextProps.tracePaths?.downstream &&
      prevProps.storyActiveInfo?.activeLinks ===
        nextProps.storyActiveInfo?.activeLinks &&
      prevProps.storyActiveInfo?.currentIncomingLinkKey ===
        nextProps.storyActiveInfo?.currentIncomingLinkKey &&
      prevProps.selectedInsight === nextProps.selectedInsight
    );
  },
);

export default GraphLinkComponent;
