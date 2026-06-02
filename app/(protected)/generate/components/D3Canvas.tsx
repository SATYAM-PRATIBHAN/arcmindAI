// app/(protected)/generate/components/D3Canvas.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import {
  Laptop,
  Cpu,
  Database,
  Cloud,
  ExternalLink,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Maximize,
  Search,
  X,
  ShieldAlert,
  ShieldQuestion,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiagram } from "@/lib/contexts/DiagramContext";
import { parseMermaidToJSON } from "@/lib/utils/diagram-parser";
import {
  DiagramNode,
  DiagramLink,
  SystemGraph,
  DiagramLayer,
  NodeSeverity,
} from "@/types/diagram";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface D3CanvasProps {
  chart: string;
}

const LAYER_STYLES: Record<
  DiagramLayer,
  {
    color: string;
    dotColor: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
  }
> = {
  Frontend: {
    color: "from-blue-500/10 to-blue-600/5 border-blue-500/30 text-blue-400",
    dotColor: "bg-blue-400",
    icon: Laptop,
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  API: {
    color:
      "from-violet-500/10 to-violet-600/5 border-violet-500/30 text-violet-400",
    dotColor: "bg-violet-400",
    icon: Cpu,
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  Database: {
    color:
      "from-emerald-500/10 to-emerald-600/5 border-emerald-500/30 text-emerald-400",
    dotColor: "bg-emerald-400",
    icon: Database,
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  Infrastructure: {
    color:
      "from-amber-500/10 to-amber-600/5 border-amber-500/30 text-amber-400",
    dotColor: "bg-amber-400",
    icon: Cloud,
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  External: {
    color: "from-pink-500/10 to-pink-600/5 border-pink-500/30 text-pink-400",
    dotColor: "bg-pink-400",
    icon: ExternalLink,
    badge: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  Unknown: {
    color:
      "from-slate-500/10 to-slate-600/5 border-slate-500/30 text-slate-400",
    dotColor: "bg-slate-400",
    icon: HelpCircle,
    badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
};

const SEVERITY_ICONS: Record<
  NodeSeverity,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  Low: { icon: ShieldCheck, color: "text-green-500" },
  Medium: { icon: ShieldQuestion, color: "text-blue-500" },
  High: { icon: ShieldAlert, color: "text-orange-500" },
  Critical: { icon: ShieldAlert, color: "text-red-500 animate-pulse" },
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

// Calculate border intersection point for clean link line terminations
function getTargetPoint(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  w: number,
  h: number,
) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  if (dx === 0 && dy === 0) return { x: targetX, y: targetY };

  const m = dy / dx;
  const halfW = w / 2;
  const halfH = h / 2;

  if (Math.abs(m) <= halfH / halfW) {
    const borderX = dx > 0 ? -halfW : halfW;
    const borderY = borderX * m;
    return { x: targetX + borderX, y: targetY + borderY };
  } else {
    const borderY = dy > 0 ? -halfH : halfH;
    const borderX = borderY / m;
    return { x: targetX + borderX, y: targetY + borderY };
  }
}

export default function D3Canvas({ chart }: D3CanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomBehaviorRef = useRef<any>(null);

  const { selectedNodeId, setSelectedNodeId, searchQuery, activeLayers } =
    useDiagram();

  const [graphData, setGraphData] = useState<SystemGraph>({
    nodes: [],
    links: [],
  });
  const [simulationNodes, setSimulationNodes] = useState<DiagramNode[]>([]);
  const [simulationLinks, setSimulationLinks] = useState<DiagramLink[]>([]);
  const [isSimulationActive, setIsSimulationActive] = useState(true);

  // Parse Mermaid code whenever it changes
  useEffect(() => {
    if (chart) {
      try {
        const parsed = parseMermaidToJSON(chart);
        setGraphData(parsed);
      } catch (err) {
        console.error("Failed to parse Mermaid to JSON in D3Canvas:", err);
      }
    }
  }, [chart]);

  // Fit to screen view utility
  const fitToScreen = useCallback(() => {
    if (!svgRef.current || !gRef.current || !zoomBehaviorRef.current) return;

    const svg = d3.select(svgRef.current);
    const bounds = gRef.current.getBBox();

    const parentWidth = svgRef.current.clientWidth || 800;
    const parentHeight = svgRef.current.clientHeight || 500;

    const width = bounds.width;
    const height = bounds.height;

    if (width === 0 || height === 0) return;

    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;

    const paddingFactor = 0.85;
    const scale =
      paddingFactor / Math.max(width / parentWidth, height / parentHeight);
    const clampedScale = Math.max(0.2, Math.min(scale, 1.5));

    const tx = parentWidth / 2 - clampedScale * midX;
    const ty = parentHeight / 2 - clampedScale * midY;

    svg
      .transition()
      .duration(750)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(tx, ty).scale(clampedScale),
      );
  }, []);

  // Initialize force-directed simulation
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    const nodes = graphData.nodes.map((n) => ({ ...n }));
    const links = graphData.links.map((l) => ({
      ...l,
      source: typeof l.source === "object" ? l.source.id : l.source,
      target: typeof l.target === "object" ? l.target.id : l.target,
    }));

    const width = svgRef.current?.clientWidth || 800;
    const height = svgRef.current?.clientHeight || 600;

    // Arrange nodes circularly to avoid overlapping start state
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      node.x = width / 2 + 250 * Math.cos(angle);
      node.y = height / 2 + 250 * Math.sin(angle);
    });

    setIsSimulationActive(true);

    const simulation = d3
      .forceSimulation<DiagramNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<DiagramNode, any>(links)
          .id((d) => d.id)
          .distance(200),
      )
      .force("charge", d3.forceManyBody().strength(-1200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(120))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    let tickCount = 0;
    simulation.on("tick", () => {
      setSimulationNodes([...nodes]);
      setSimulationLinks([...links]);
      tickCount++;
      if (tickCount === 25) {
        fitToScreen();
      }
    });

    simulation.on("end", () => {
      setIsSimulationActive(false);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, fitToScreen]);

  // Set up D3 Zoom behavior
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", (event) => {
        d3.select(gRef.current).attr("transform", event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);
    svg.on("dblclick.zoom", null); // Disable double click zoom for better control
  }, []);

  // Handle zooming using floating UI controls
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 1 / 1.3);
    }
  };

  // Node Drag Handler (Mouse and Touch)
  const handleNodeDragStart = (
    e: React.MouseEvent | React.TouchEvent,
    node: DiagramNode,
  ) => {
    e.stopPropagation();

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const startX = node.x ?? 0;
    const startY = node.y ?? 0;

    let currentScale = 1;
    if (svgRef.current) {
      const transform = d3.zoomTransform(svgRef.current);
      currentScale = transform.k;
    }

    const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
      const curX =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientX
          : moveEvent.clientX;
      const curY =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientY
          : moveEvent.clientY;

      const dx = (curX - clientX) / currentScale;
      const dy = (curY - clientY) / currentScale;

      node.fx = startX + dx;
      node.fy = startY + dy;
      node.x = startX + dx;
      node.y = startY + dy;

      setSimulationNodes((prev) =>
        prev.map((n) =>
          n.id === node.id
            ? { ...n, x: node.x, y: node.y, fx: node.fx, fy: node.fy }
            : n,
        ),
      );
    };

    const handleDragEnd = () => {
      node.fx = null;
      node.fy = null;
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend", handleDragEnd);
  };

  // Filter verification logic
  const hasActiveFilters =
    searchQuery.trim().length > 0 || activeLayers.length > 0;

  const isHighlighted = (node: DiagramNode) => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchLabel = node.label.toLowerCase().includes(q);
      const matchType = node.type.toLowerCase().includes(q);
      const matchId = node.id.toLowerCase().includes(q);
      if (!matchLabel && !matchType && !matchId) return false;
    }
    if (activeLayers.length > 0) {
      if (!activeLayers.includes(node.layer)) return false;
    }
    return true;
  };

  const selectedNode = simulationNodes.find((n) => n.id === selectedNodeId);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[650px] overflow-hidden bg-[#0a0c10] border border-border/40 rounded-2xl flex"
    >
      {/* Canvas Area */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* Floating Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-card/60 backdrop-blur-md border border-border/40 p-1.5 rounded-2xl shadow-xl">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleZoomIn}
                  className="w-9 h-9 rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Zoom In</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleZoomOut}
                  className="w-9 h-9 rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Zoom Out</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={fitToScreen}
                  className="w-9 h-9 rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Fit to Screen</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Simulation Indicator */}
        {isSimulationActive && (
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-border/20 px-3 py-1.5 rounded-full text-xs text-muted-foreground shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            Graph layout optimizing...
          </div>
        )}

        {/* The SVG element */}
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        >
          {/* Arrow definitions for markers */}
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="0"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3f4b5c" />
            </marker>
            <marker
              id="arrow-sync"
              viewBox="0 0 10 10"
              refX="0"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#4f5e74" />
            </marker>
            <marker
              id="arrow-async"
              viewBox="0 0 10 10"
              refX="0"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#718096" />
            </marker>
            <marker
              id="arrow-highlighted"
              viewBox="0 0 10 10"
              refX="0"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#a0aec0" />
            </marker>
          </defs>

          {/* D3 Zoom Container */}
          <g ref={gRef}>
            {/* Draw Links */}
            <g className="links-group">
              {simulationLinks.map((link, idx) => {
                const sourceNode = link.source as DiagramNode;
                const targetNode = link.target as DiagramNode;

                if (
                  !sourceNode ||
                  !targetNode ||
                  sourceNode.x === undefined ||
                  sourceNode.y === undefined ||
                  targetNode.x === undefined ||
                  targetNode.y === undefined
                ) {
                  return null;
                }

                // Get border-intersection points
                const targetPoint = getTargetPoint(
                  sourceNode.x,
                  sourceNode.y,
                  targetNode.x,
                  targetNode.y,
                  NODE_WIDTH,
                  NODE_HEIGHT,
                );

                const sourcePoint = getTargetPoint(
                  targetNode.x,
                  targetNode.y,
                  sourceNode.x,
                  sourceNode.y,
                  NODE_WIDTH,
                  NODE_HEIGHT,
                );

                const highlighted =
                  !hasActiveFilters ||
                  (isHighlighted(sourceNode) && isHighlighted(targetNode));

                const isLinkSelected =
                  selectedNodeId === sourceNode.id ||
                  selectedNodeId === targetNode.id;

                const lineStroke = isLinkSelected
                  ? "stroke-neutral-300 stroke-[2px]"
                  : highlighted
                    ? "stroke-neutral-600 stroke-[1.5px]"
                    : "stroke-neutral-800 opacity-20 stroke-[1px]";

                const markerUrl = isLinkSelected
                  ? "url(#arrow-highlighted)"
                  : highlighted
                    ? link.type === "async"
                      ? "url(#arrow-async)"
                      : "url(#arrow-sync)"
                    : "url(#arrow-default)";

                const isDashed = link.type === "async";

                // Draw line
                return (
                  <g
                    key={`link-${idx}`}
                    className="transition-opacity duration-300"
                  >
                    <line
                      x1={sourcePoint.x}
                      y1={sourcePoint.y}
                      x2={targetPoint.x}
                      y2={targetPoint.y}
                      className={lineStroke}
                      strokeDasharray={isDashed ? "5, 5" : undefined}
                      markerEnd={markerUrl}
                    />

                    {/* Optional Connection labels */}
                    {link.label && (
                      <g
                        transform={`translate(${(sourcePoint.x + targetPoint.x) / 2}, ${
                          (sourcePoint.y + targetPoint.y) / 2 - 6
                        })`}
                      >
                        <text
                          textAnchor="middle"
                          className="fill-neutral-500 font-mono text-[9px] select-none"
                          style={{
                            paintOrder: "stroke",
                            stroke: "#0a0c10",
                            strokeWidth: "3px",
                            strokeLinejoin: "round",
                          }}
                        >
                          {link.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Draw Nodes */}
            <g className="nodes-group">
              {simulationNodes.map((node) => {
                if (node.x === undefined || node.y === undefined) return null;

                const style = LAYER_STYLES[node.layer] || LAYER_STYLES.Unknown;
                const IconComponent = style.icon;
                const SeverityIcon =
                  SEVERITY_ICONS[node.severity]?.icon || ShieldCheck;
                const severityColor =
                  SEVERITY_ICONS[node.severity]?.color || "text-neutral-500";

                const isNodeSelected = selectedNodeId === node.id;
                const highlighted = !hasActiveFilters || isHighlighted(node);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="transition-opacity duration-300"
                    opacity={highlighted ? 1.0 : 0.15}
                  >
                    <foreignObject
                      x={-NODE_WIDTH / 2}
                      y={-NODE_HEIGHT / 2}
                      width={NODE_WIDTH}
                      height={NODE_HEIGHT}
                      className="overflow-visible"
                    >
                      <div
                        onMouseDown={(e) => handleNodeDragStart(e, node)}
                        onTouchStart={(e) => handleNodeDragStart(e, node)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(isNodeSelected ? null : node.id);
                        }}
                        className={`w-full h-full rounded-2xl border bg-gradient-to-br flex flex-col p-3 text-left transition-all duration-300 select-none shadow-md ${style.color} ${
                          isNodeSelected
                            ? "border-white ring-2 ring-white/20 shadow-white/5"
                            : "hover:border-neutral-400 hover:brightness-110"
                        } cursor-grab active:cursor-grabbing`}
                      >
                        {/* Header: Layer Dot + Severity Indicator */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${style.dotColor}`}
                            />
                            <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                              {node.layer}
                            </span>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help">
                                  <SeverityIcon
                                    className={`w-3.5 h-3.5 ${severityColor}`}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Severity: {node.severity}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Title & Info */}
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <IconComponent className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-neutral-200 truncate">
                              {node.label}
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                              {node.type}
                            </div>
                          </div>
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* Floating Info Panel for Selected Node */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 w-72 bg-card/90 backdrop-blur-md border border-border/40 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-300 z-20">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium border ${LAYER_STYLES[selectedNode.layer]?.badge || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}
              >
                {selectedNode.layer}
              </span>
              <h3 className="text-sm font-bold text-foreground mt-1 truncate">
                {selectedNode.label}
              </h3>
              <p className="text-[10px] text-muted-foreground truncate">
                {selectedNode.type}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedNodeId(null)}
              className="w-6 h-6 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="h-px bg-border/40" />

          {/* Severity & Metrics */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-muted/40 p-2 rounded-xl border border-border/20">
              <span className="text-muted-foreground block text-[9px]">
                Criticality
              </span>
              <span
                className={`font-semibold flex items-center gap-1 ${SEVERITY_ICONS[selectedNode.severity]?.color || "text-neutral-500"}`}
              >
                {selectedNode.severity}
              </span>
            </div>
            <div className="bg-muted/40 p-2 rounded-xl border border-border/20">
              <span className="text-muted-foreground block text-[9px]">
                ID Reference
              </span>
              <span className="font-mono text-neutral-300 truncate block">
                {selectedNode.id}
              </span>
            </div>
          </div>

          {/* Description */}
          {selectedNode.description ? (
            <div className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/10 max-h-24 overflow-y-auto">
              {selectedNode.description}
            </div>
          ) : (
            <div className="text-xs italic text-muted-foreground/60 leading-relaxed bg-muted/10 p-2.5 rounded-xl border border-border/10">
              No detailed node description provided in the system model.
            </div>
          )}

          {/* Connections list */}
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
              Connections
            </span>
            {simulationLinks.filter(
              (l) =>
                (typeof l.source === "object" ? l.source.id : l.source) ===
                  selectedNode.id ||
                (typeof l.target === "object" ? l.target.id : l.target) ===
                  selectedNode.id,
            ).length === 0 ? (
              <span className="text-[10px] text-muted-foreground/60 italic">
                No active connections
              </span>
            ) : (
              simulationLinks
                .filter(
                  (l) =>
                    (typeof l.source === "object" ? l.source.id : l.source) ===
                      selectedNode.id ||
                    (typeof l.target === "object" ? l.target.id : l.target) ===
                      selectedNode.id,
                )
                .map((link, i) => {
                  const src = link.source as DiagramNode;
                  const tgt = link.target as DiagramNode;
                  const isOutbound = src.id === selectedNode.id;
                  const otherNode = isOutbound ? tgt : src;

                  return (
                    <div
                      key={`conn-${i}`}
                      onClick={() => setSelectedNodeId(otherNode.id)}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border/30 cursor-pointer transition-colors text-[10px]"
                    >
                      <span className="text-muted-foreground truncate max-w-[120px]">
                        {isOutbound
                          ? "Sends request to"
                          : "Receives request from"}
                      </span>
                      <span className="font-bold text-foreground truncate max-w-[100px]">
                        {otherNode.label}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
