"use client";

import { useDiagram } from "@/lib/contexts/DiagramContext";
import { analyzeDiagramRelations } from "@/lib/utils/diagram-analyzer";
import {
  DiagramLayer,
  DiagramLink,
  DiagramNode,
  NodeShape,
  SystemGraph,
} from "@/types/diagram";
import * as d3 from "d3";
import { Maximize, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FloatingSearch from "@/components/diagram/FloatingSearch";

type NodeSelection = d3.Selection<SVGGElement, DiagramNode, null, undefined>;

interface InteractiveDiagramProps {
  /** Parsed system graph to render. When null/empty, an empty state is shown. */
  systemGraph?: SystemGraph | null;
}

/** Visual styling resolved from a node's Mermaid `classDef` declarations. */
interface NodeStyle {
  fill: string;
  stroke: string;
  strokeWidth: string;
}

const DEFAULT_FONT_SIZE = 12;
const DEFAULT_PADDING = 16;
const DEFAULT_NODE_HEIGHT = DEFAULT_FONT_SIZE * 4;
const DEFAULT_NODE_STYLE: NodeStyle = {
  fill: "var(--card)",
  stroke: "currentColor",
  strokeWidth: "1.5px",
};

const DEFAULT_LAYER_COLORS: Record<DiagramLayer, string> = {
  Frontend: "#3b82f6",
  API: "#8b5cf6",
  Database: "#10b981",
  Infrastructure: "#f59e0b",
  External: "#ec4899",
  Unknown: "var(--card)",
};
/**
 * Parse Mermaid-style class declarations such as
 * `["fill:#ffcc99", "stroke:#333", "stroke-width:2px"]` into concrete SVG
 * presentation attributes, falling back to theme-aware defaults.
 */
function parseNodeStyle(node: DiagramNode): NodeStyle {
  const style: NodeStyle = { ...DEFAULT_NODE_STYLE };
  if (DEFAULT_LAYER_COLORS[node.layer]) {
    style.fill = DEFAULT_LAYER_COLORS[node.layer];
  }

  const classes = node.classes;
  classes?.forEach((declaration) => {
    const [rawKey, ...rest] = declaration.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rest?.join(":").trim();
    if (!key || !value) return;

    if (key === "fill") style.fill = value;
    else if (key === "stroke") style.stroke = value;
    else if (key === "stroke-width") style.strokeWidth = value;
  });

  return style;
}

/** Estimate the rendered width of a node from its label length. */
function nodeWidth(node: DiagramNode): number {
  const length = node.label?.length ?? 0;
  return Math.max(90, (length * DEFAULT_FONT_SIZE) / 2 + DEFAULT_PADDING * 2);
}

/** Apply resolved fill/stroke attributes to a shape element. */
function applyStyle<E extends d3.BaseType>(
  shape: d3.Selection<E, DiagramNode, null, undefined>,
  style: NodeStyle,
): d3.Selection<E, DiagramNode, null, undefined> {
  return shape
    .attr("fill", style.fill)
    .attr("stroke", style.stroke)
    .attr("stroke-width", style.strokeWidth);
}

/**
 * Render the SVG geometry for a node's shape,
 * applying the resolved `classDef` styling to each shape primitive.
 */
function drawNodeShape(
  group: NodeSelection,
  shape: NodeShape,
  w: number,
  h: number,
  style: NodeStyle,
): void {
  const w2 = w / 2;
  const h2 = h / 2;

  switch (shape) {
    case "circle": {
      applyStyle(group.append("circle").attr("r", Math.max(w2, h2)), style);
      return;
    }

    case "diamond": {
      const dw = w2 * 1.4;
      const dh = h2 * 1.6;
      applyStyle(
        group
          .append("polygon")
          .attr("points", `0,${-dh} ${dw},0 0,${dh} ${-dw},0`),
        style,
      );
      return;
    }

    case "hexagon": {
      const inset = h2;
      applyStyle(
        group
          .append("polygon")
          .attr(
            "points",
            `${-w2 + inset},${-h2} ${w2 - inset},${-h2} ${w2},0 ${w2 - inset},${h2} ${-w2 + inset},${h2} ${-w2},0`,
          ),
        style,
      );
      return;
    }

    case "parallelogram": {
      const skew = h2;
      applyStyle(
        group
          .append("polygon")
          .attr(
            "points",
            `${-w2 + skew},${-h2} ${w2 + skew},${-h2} ${w2 - skew},${h2} ${-w2 - skew},${h2}`,
          ),
        style,
      );
      return;
    }

    case "cylinder": {
      const ry = Math.min(15, h2 * 0.8);
      const top = -h2 * 1.7 + ry;
      const bottom = h2 * 1.7 - ry;
      applyStyle(
        group
          .append("path")
          .attr(
            "d",
            [
              `M ${-w2},${top}`,
              `A ${w2} ${ry} 0 0 1 ${w2} ${top}`,
              `L ${w2} ${bottom}`,
              `A ${w2} ${ry} 0 0 1 ${-w2} ${bottom}`,
              "Z",
            ].join(" "),
          ),
        style,
      );
      // The visible top rim.
      applyStyle(
        group
          .append("path")
          .attr("d", `M ${-w2},${top} A ${w2} ${ry} 0 0 0 ${w2} ${top}`),
        style,
      ).attr("fill", "none");
      return;
    }

    case "stadium": {
      applyStyle(
        group
          .append("rect")
          .attr("x", -w2)
          .attr("y", -h2)
          .attr("width", w)
          .attr("height", h)
          .attr("rx", h2)
          .attr("ry", h2),
        style,
      );
      return;
    }

    case "rectangle":
    default: {
      applyStyle(
        group
          .append("rect")
          .attr("x", -w2)
          .attr("y", -h2)
          .attr("width", w)
          .attr("height", h)
          .attr("rx", 6)
          .attr("ry", 6),
        style,
      );
      return;
    }
  }
}

/**
 * InteractiveDiagram component initializes a D3 workspace that scales to its parent container.
 * This is the base component for the Stream 2 Core Rendering Engine milestone.
 */
export default function InteractiveDiagram({
  systemGraph,
}: InteractiveDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { isD3Enabled } = useDiagram();

  const selectedIdRef = useRef<string | null>(null);
  const relations = useMemo(
    () => (systemGraph ? analyzeDiagramRelations(systemGraph) : {}),
    [systemGraph],
  );
  const getLinkOpacity = (d: DiagramLink) =>
    d.type === "fallback" ? 0.25 : 0.4;
  const getLinkDashArray = (d: DiagramLink) =>
    d.type === "async" ? "6 4" : null;

  // Use ResizeObserver to keep track of the container's dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use contentRect for accurate sizing
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  > | null>(null);
  const gZoomRef = useRef<d3.Selection<
    SVGGElement,
    unknown,
    null,
    undefined
  > | null>(null);

  const fitToScreen = useCallback(
    (opts?: { padding?: number; animate?: boolean }) => {
      const svgEl = svgRef.current;
      const gZoom = gZoomRef.current;
      const svgSel = svgSelectionRef.current;

      if (!svgEl || !gZoom || !svgSel) return;

      const padding = opts?.padding ?? 24;

      // Compute bounds based on current node/link positions.
      // Prefer the rendered geometry inside gZoom.
      const bounds = ((): {
        x: number;
        y: number;
        width: number;
        height: number;
      } | null => {
        try {
          const bbox = (gZoom.node() as SVGGElement).getBBox();
          if (!bbox || bbox.width === 0 || bbox.height === 0) return null;

          return {
            x: bbox.x,
            y: bbox.y,
            width: Math.max(1, bbox.width),
            height: Math.max(1, bbox.height),
          };
        } catch {
          return null;
        }
      })();

      if (!bounds) return;

      const viewportWidth = dimensions.width;
      const viewportHeight = dimensions.height;
      if (!viewportWidth || !viewportHeight) return;

      const scale = Math.min(
        (viewportWidth - padding * 2) / bounds.width,
        (viewportHeight - padding * 2) / bounds.height,
      );

      const clampedScale = Math.max(0.1, Math.min(5, scale));

      const targetX = bounds.x + bounds.width / 2;
      const targetY = bounds.y + bounds.height / 2;

      // D3 zoom transform uses: screen = (world * k) + (tx, ty)
      // We want target center to map to viewport center.
      const k = clampedScale;
      const tx = viewportWidth / 2 - targetX * k;
      const ty = viewportHeight / 2 - targetY * k;

      const t = d3.zoomIdentity.translate(tx, ty).scale(k);

      if (opts?.animate) {
        svgSel.transition().duration(500).call(zoomRef.current!.transform, t);
      } else {
        svgSel.call(zoomRef.current!.transform, t);
      }
    },
    [dimensions],
  );

  // Initialize and update the SVG viewBox and force-directed graph
  useEffect(() => {
    if (
      !svgRef.current ||
      !systemGraph?.nodes?.length ||
      dimensions.width === 0 ||
      dimensions.height === 0
    )
      return;

    const svgSel = d3.select(svgRef.current);
    svgSelectionRef.current = svgSel;

    // Update viewBox dynamically to match dimensions
    svgSel.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

    // Clear previous elements before rendering
    svgSel.selectAll("*").remove();

    // Create zoom viewport group that holds ALL drawable diagram content
    const gZoom = svgSel.append("g").attr("class", "d3-zoom-viewport");
    gZoomRef.current = gZoom;

    // Attach d3.zoom to the SVG
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .filter((event) => {
        // Allow mouse drag + wheel + touch/pinch.
        // Disallow right-click.
        return !(event instanceof MouseEvent && event.button === 2);
      })
      .on("zoom", (event) => {
        gZoom.attr("transform", event.transform.toString());
      });

    zoomRef.current = zoom;
    svgSel.call(zoom);

    const nodes: DiagramNode[] = systemGraph.nodes.map((n) => ({ ...n }));
    // parseMermaidToJSON already guarantees that the source and target exist in nodes.
    const links: DiagramLink[] = systemGraph.links.map((l) => ({ ...l }));
    const g = gZoom.append("g").attr("class", "d3-diagram");

    const link = g
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", (d) => getLinkOpacity(d))
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) => (d.type === "async" ? "6 4" : null));

    const node = g
      .append("g")
      .attr("class", "d3-nodes")
      .selectAll<SVGGElement, DiagramNode>("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "d3-node");

    node.each((d, i, groups) => {
      const group = d3.select<SVGGElement, DiagramNode>(
        groups[i] as SVGGElement,
      );
      const style = parseNodeStyle(d);

      drawNodeShape(group, d.shape, nodeWidth(d), DEFAULT_NODE_HEIGHT, style);

      group
        .append("text")
        .text(d.label)
        .attr("font-size", DEFAULT_FONT_SIZE)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "currentColor")
        .attr("pointer-events", "none");
    });

    const applyHighlight = (selectedId: string | null) => {
      if (!selectedId || !relations[selectedId]) {
        node.style("opacity", 1);
        link
          .attr("stroke", "currentColor")
          .attr("stroke-opacity", (d) => getLinkOpacity(d))
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", (d) => getLinkDashArray(d));
        return;
      }

      const rel = relations[selectedId];
      const upstream = new Set<string>([
        selectedId,
        ...rel.ancestors.map((n) => n.id),
      ]);
      const downstream = new Set<string>([
        selectedId,
        ...rel.descendants.map((n) => n.id),
      ]);
      const onPath = (s: string, t: string) =>
        (upstream.has(s) && upstream.has(t)) ||
        (downstream.has(s) && downstream.has(t));

      node.style("opacity", (d) =>
        upstream.has(d.id) || downstream.has(d.id) ? 1 : 0.2,
      );

      link
        .attr("stroke", (d) =>
          onPath((d.source as DiagramNode).id, (d.target as DiagramNode).id)
            ? "var(--primary)"
            : "currentColor",
        )
        .attr("stroke-opacity", (d) =>
          onPath((d.source as DiagramNode).id, (d.target as DiagramNode).id)
            ? 0.9
            : 0.05,
        )
        .attr("stroke-width", (d) =>
          onPath((d.source as DiagramNode).id, (d.target as DiagramNode).id)
            ? 3
            : 2,
        );
    };

    node.style("cursor", "pointer").on("click", (event, d) => {
      event.stopPropagation();
      selectedIdRef.current = d.id;
      applyHighlight(selectedIdRef.current);
    });

    svgSel.on("click", () => {
      selectedIdRef.current = null;
      applyHighlight(null);
    });

    // Initialize the physics engine
    const simulation = d3
      .forceSimulation<DiagramNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<DiagramNode, DiagramLink>(links)
          .id((d) => d.id)
          .distance(150),
      )
      .force("charge", d3.forceManyBody().strength(-1000))
      .force(
        "collision",
        d3.forceCollide<DiagramNode>((d) => nodeWidth(d) / 2 + DEFAULT_PADDING),
      )
      .force(
        "center",
        d3.forceCenter(dimensions.width / 2, dimensions.height / 2),
      )
      .force("x", d3.forceX(dimensions.width / 2).strength(0.05))
      .force("y", d3.forceY(dimensions.height / 2).strength(0.05));

    simulation.on("tick", () => {
      link
        .attr("x1", (d: DiagramLink) => (d.source as DiagramNode).x ?? 0)
        .attr("y1", (d: DiagramLink) => (d.source as DiagramNode).y ?? 0)
        .attr("x2", (d: DiagramLink) => (d.target as DiagramNode).x ?? 0)
        .attr("y2", (d: DiagramLink) => (d.target as DiagramNode).y ?? 0);

      node.attr(
        "transform",
        (d: DiagramNode) => `translate(${d.x ?? 0}, ${d.y ?? 0})`,
      );
    });

    simulation.on("end", () => {
      simulation.stop();
      // Fit after simulation stabilizes
      fitToScreen({ padding: 28 });
    });

    applyHighlight(selectedIdRef.current);

    // Fit immediately once nodes exist (positions will update quickly)
    const raf = window.requestAnimationFrame(() => {
      fitToScreen({ padding: 28 });
    });

    // Clean up
    return () => {
      window.cancelAnimationFrame(raf);
      simulation.stop();
    };
  }, [dimensions, fitToScreen, systemGraph, relations]);

  const handleZoomIn = () => {
    const svgSel = svgSelectionRef.current;
    if (!svgSel || !zoomRef.current) return;
    svgSel.transition().duration(150).call(zoomRef.current.scaleBy, 1.2);
  };

  const handleZoomOut = () => {
    const svgSel = svgSelectionRef.current;
    if (!svgSel || !zoomRef.current) return;
    svgSel
      .transition()
      .duration(150)
      .call(zoomRef.current.scaleBy, 1 / 1.2);
  };

  const handleReset = () => fitToScreen({ padding: 28, animate: true });

  if (!isD3Enabled) return null;

  return (
    <div
      ref={containerRef}
      className="w-full h-125 min-h-100 rounded-2xl border border-border/40 bg-card/30 overflow-hidden backdrop-blur-sm shadow-inner relative flex items-center justify-center transition-all duration-500"
    >
      {/* Floating search input (top-left) */}
      <FloatingSearch position="left" />
      {/* Floating viewport controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <div className="inline-flex rounded-xl border border-border/40 bg-background/60 backdrop-blur p-1 shadow-sm gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent active:scale-95 transition-all"
            aria-label="Zoom in"
            title="Zoom In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent active:scale-95 transition-all"
            aria-label="Zoom out"
            title="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent active:scale-95 transition-all"
            aria-label="Reset view"
            title="Reset View (Fit to Screen)"
          >
            <Maximize className="w-3.5 h-3.5" />
            Reset View
          </button>
        </div>
      </div>
      <svg
        ref={svgRef}
        className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Dev Mode Badge */}
      <div className="absolute top-4 right-4 translate-x-0 translate-y-12 px-2 py-1 bg-primary/10 border border-primary/20 rounded text-[10px] font-mono text-primary uppercase tracking-widest pointer-events-none">
        D3 Alpha
      </div>
    </div>
  );
}
