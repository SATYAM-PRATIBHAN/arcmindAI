import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { GraphNode, GraphLink, GraphSubgraph } from "../../utils/parser";
import { SystemInsight } from "../../utils/insights";
import { Scenario } from "./StoryPlaybook";
import { GraphNodeComponent } from "./GraphNodeComponent";
import { GraphLinkComponent } from "./GraphLinkComponent";

interface GraphCanvasProps {
  chart: string;
  nodes: GraphNode[];
  links: GraphLink[];
  subgraphs: GraphSubgraph[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  hoveredNodeId: string | null;
  setHoveredNodeId: (id: string | null) => void;
  zoomTransform: d3.ZoomTransform;
  setZoomTransform: (transform: d3.ZoomTransform) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  zoomBehaviorRef: React.MutableRefObject<d3.ZoomBehavior<
    SVGSVGElement,
    unknown
  > | null>;
  traceDirection: "none" | "upstream" | "downstream" | "full";
  tracePaths: { upstream: Set<string>; downstream: Set<string> } | null;
  highlightedNodes: Set<string> | null;
  storyActiveInfo: {
    activeNodeIds: Set<string>;
    currentNodeId: string | null;
    activeLinks: Set<string>;
    currentIncomingLinkKey: string | null;
  } | null;
  selectedInsight: SystemInsight | null;
  setSelectedInsight: (val: SystemInsight | null) => void;
  isStoryMode: boolean;
  currentScenarioIndex: number;
  setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsPlaying: (val: boolean) => void;
  scenarios: Scenario[];
  heatmapMode: boolean;
  getHeatmapColorClasses: (nodeId: string) => {
    bg: string;
    border: string;
    glow: string;
    text: string;
  };
  cyclicNodeIds: Set<string>;
  criticalNodes: Set<string>;
  dimensions: { width: number; height: number };
  simulation: d3.Simulation<GraphNode, GraphLink> | null;
  setActiveSidebarTab: (val: "specs" | "insights") => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  chart,
  nodes,
  links,
  subgraphs,
  selectedNodeId,
  setSelectedNodeId,
  hoveredNodeId,
  setHoveredNodeId,
  zoomTransform,
  setZoomTransform,
  svgRef,
  zoomBehaviorRef,
  traceDirection,
  tracePaths,
  highlightedNodes,
  storyActiveInfo,
  selectedInsight,
  setSelectedInsight,
  isStoryMode,
  currentScenarioIndex,
  setCurrentStepIndex,
  setIsPlaying,
  scenarios,
  heatmapMode,
  getHeatmapColorClasses,
  cyclicNodeIds,
  criticalNodes,
  dimensions,
  simulation,
  setActiveSidebarTab,
}) => {
  const hasInitializedZoomRef = useRef(false);
  // Reset zoom initialization flag if the diagram/chart source changes
  useEffect(() => {
    hasInitializedZoomRef.current = false;
  }, [chart]);

  // Setup D3 zoom and pan listeners
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on("zoom", (event) => {
        setZoomTransform(event.transform);
      });

    svg.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    // Cleanup: remove zoom listeners if any
    return () => {
      svg.on(".zoom", null);
    };
  }, [svgRef, zoomBehaviorRef, setZoomTransform]);

  // Handle Initial Viewport Fitting after nodes are fully computed
  useEffect(() => {
    if (
      nodes.length > 0 &&
      !hasInitializedZoomRef.current &&
      svgRef.current &&
      zoomBehaviorRef.current
    ) {
      const validNodes = nodes.filter(
        (n) => n.x !== undefined && n.y !== undefined,
      );
      // Wait until all nodes have coordinates assigned by simulation
      if (validNodes.length === nodes.length) {
        const svg = d3.select(svgRef.current);
        const minX = Math.min(...validNodes.map((n) => n.x || 0));
        const maxX = Math.max(...validNodes.map((n) => n.x || 0));
        const minY = Math.min(...validNodes.map((n) => n.y || 0));
        const maxY = Math.max(...validNodes.map((n) => n.y || 0));

        const graphWidth = maxX - minX + 180;
        const graphHeight = maxY - minY + 180;
        const dx = maxX + minX;
        const dy = maxY + minY;

        const scale = Math.min(
          0.85,
          Math.min(
            dimensions.width / graphWidth,
            dimensions.height / graphHeight,
          ),
        );
        const tx = dimensions.width / 2 - (scale * dx) / 2;
        const ty = dimensions.height / 2 - (scale * dy) / 2;

        svg.call(
          zoomBehaviorRef.current.transform,
          d3.zoomIdentity.translate(tx, ty).scale(scale),
        );
        hasInitializedZoomRef.current = true;
      }
    }
  }, [nodes, dimensions, svgRef, zoomBehaviorRef]);

  // Bind D3 Drag behavior to node groups
  useEffect(() => {
    if (!svgRef.current || !simulation || nodes.length === 0) return;

    const dragBehavior = d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    d3.select(svgRef.current)
      .selectAll<SVGGElement, GraphNode>(".node-group")
      .data(nodes, (d) => d.id)
      .call(dragBehavior);
  }, [nodes, simulation, svgRef]);

  return (
    <div className="flex-1 h-full z-1 relative">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      >
        {/* Defs for gradients, filters, markers */}
        <defs>
          {/* Glow filters for nodes */}
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gold glow filter for critical nodes */}
          <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feColorMatrix
              type="matrix"
              values="
                1 0 0 0 0.96
                0 1 0 0 0.62
                0 0 1 0 0.04
                0 0 0 0.8 0
              "
            />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Markers for links (arrows) */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="33"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
          </marker>
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="33"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
          </marker>
          <marker
            id="arrow-trace-upstream"
            viewBox="0 0 10 10"
            refX="33"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
          </marker>
          <marker
            id="arrow-trace-downstream"
            viewBox="0 0 10 10"
            refX="33"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
          </marker>
        </defs>

        {/* Scaled and translated viewport container */}
        <g transform={zoomTransform.toString()}>
          {/* 1. Subgraph Layer bounding areas */}
          {subgraphs.map((sub) => {
            // Find all nodes in this subgraph
            const subNodes = nodes.filter((n) => n.parentId === sub.id);
            if (subNodes.length === 0) return null;

            // Calculate bounding box
            const xs = subNodes.map((n) => n.x || 0);
            const ys = subNodes.map((n) => n.y || 0);
            const minX = Math.min(...xs) - 60;
            const maxX = Math.max(...xs) + 60;
            const minY = Math.min(...ys) - 50;
            const maxY = Math.max(...ys) + 50;
            const subWidth = maxX - minX;
            const subHeight = maxY - minY;

            return (
              <g key={sub.id} className="transition-all duration-500">
                {/* Backdrop */}
                <rect
                  x={minX}
                  y={minY}
                  width={subWidth}
                  height={subHeight}
                  rx={16}
                  ry={16}
                  className="fill-indigo-950/5 stroke-slate-800/35 stroke-[1.5px] border border-white/5 transition-all duration-300"
                />
                {/* Label */}
                <text
                  x={minX + 16}
                  y={minY - 10}
                  className="fill-slate-500 font-bold uppercase tracking-wider text-[10px]"
                >
                  {sub.label}
                </text>
              </g>
            );
          })}

          {/* 2. Render Links/Edges */}
          <g>
            {links.map((link, idx) => {
              const sourceNode =
                typeof link.source === "object"
                  ? (link.source as unknown as GraphNode)
                  : nodes.find((n) => n.id === link.source);
              const targetNode =
                typeof link.target === "object"
                  ? (link.target as unknown as GraphNode)
                  : nodes.find((n) => n.id === link.target);

              if (!sourceNode || !targetNode) return null;

              return (
                <GraphLinkComponent
                  key={`link-${idx}`}
                  link={link}
                  source={sourceNode}
                  target={targetNode}
                  selectedNodeId={selectedNodeId}
                  traceDirection={traceDirection}
                  tracePaths={tracePaths}
                  storyActiveInfo={storyActiveInfo}
                  selectedInsight={selectedInsight}
                  isStoryMode={isStoryMode}
                />
              );
            })}
          </g>

          {/* 3. Render Nodes */}
          <g>
            {nodes.map((node) => {
              if (node.x === undefined || node.y === undefined) return null;

              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isCritical = criticalNodes.has(node.id);

              // Highlight relations check
              const isTraceHighlight =
                highlightedNodes && highlightedNodes.has(node.id);

              const isStoryCurrent =
                storyActiveInfo && storyActiveInfo.currentNodeId === node.id;
              const isStoryActiveNode =
                storyActiveInfo && storyActiveInfo.activeNodeIds.has(node.id);

              let opacityClass = "opacity-100";
              if (isStoryMode) {
                if (isStoryCurrent) {
                  opacityClass = "opacity-100 scale-105 duration-300";
                } else if (isStoryActiveNode) {
                  opacityClass = "opacity-60";
                } else {
                  opacityClass = "opacity-10";
                }
              } else if (selectedInsight) {
                const isAffectedNode = selectedInsight.affectedNodes.includes(
                  node.id,
                );
                opacityClass = isAffectedNode ? "opacity-100" : "opacity-10";
              } else if (selectedNodeId) {
                opacityClass = isTraceHighlight ? "opacity-100" : "opacity-20";
              }

              const isInsightActive =
                !!selectedInsight &&
                selectedInsight.affectedNodes.includes(node.id);

              return (
                <g key={node.id} className="node-group">
                  <GraphNodeComponent
                    node={node}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    isCritical={isCritical}
                    isCyclicNode={cyclicNodeIds.has(node.id)}
                    isStoryCurrent={!!isStoryCurrent}
                    isInsightActive={isInsightActive}
                    insightSeverity={
                      selectedInsight ? selectedInsight.severity : null
                    }
                    heatmapMode={heatmapMode}
                    heatmapTheme={
                      heatmapMode ? getHeatmapColorClasses(node.id) : null
                    }
                    opacityClass={opacityClass}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isStoryMode) {
                        const scenario = scenarios[currentScenarioIndex];
                        const stepIdx = scenario?.steps.findIndex(
                          (s) => s.nodeId === node.id,
                        );
                        if (stepIdx !== undefined && stepIdx !== -1) {
                          setCurrentStepIndex(stepIdx);
                          setIsPlaying(false);
                        }
                      } else {
                        const targetNodeId = isSelected ? null : node.id;
                        setSelectedNodeId(targetNodeId);
                        setSelectedInsight(null);
                        if (targetNodeId) {
                          setActiveSidebarTab("specs");
                        } else {
                          setActiveSidebarTab("insights");
                        }
                      }
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                  />
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
};

export default GraphCanvas;
