"use client";
import FloatingSearch from "@/components/diagram/FloatingSearch";
import InsightPanel from "@/components/diagram/InsightPanel";
import LayerToggle, { ALL_LAYERS } from "@/components/diagram/LayerToggle";
import WalkthroughControls from "@/components/diagram/WalkthroughControls";
import { useDiagram } from "@/lib/contexts/DiagramContext";
import {
  analyzeDiagramRelations,
  buildDiagramWalkthroughSteps,
} from "@/lib/utils/diagram-analyzer";
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
  fill: "#0f172a", // Dark slate background
  stroke: "#334155",
  strokeWidth: "2px",
};

const DEFAULT_CRITICAL_COLOR = "#ef4444";
const DEFAULT_LAYER_COLORS: Record<DiagramLayer, string> = {
  Frontend: "#60a5fa", // bright blue
  API: "#a78bfa", // bright purple
  Database: "#34d399", // bright green
  Infrastructure: "#fbbf24", // bright amber
  External: "#f472b6", // bright pink
  "Other Services": "#94a3b8", // slate
};

/** Check if a node is critical severity */
function isNodeCritical(node: DiagramNode) {
  return node.severity === "Critical";
}

/**
 * Parse Mermaid-style class declarations such as
 * `["fill:#ffcc99", "stroke:#333", "stroke-width:2px"]` into concrete SVG
 * presentation attributes, falling back to theme-aware defaults.
 */
// Helper to determine text color based on background
function getContrastColor(color: string) {
  // If it's not a hex color (e.g. named color, rgb, var), default to a readable dark if it contains 'white' or 'light'
  if (!color.startsWith("#")) {
    const lower = color.toLowerCase();
    if (
      lower.includes("white") ||
      lower.includes("light") ||
      lower === "#fff" ||
      lower === "#ffffff"
    ) {
      return "#0f172a";
    }
    return "#ffffff";
  }

  let hex = color.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;

  // YIQ equation from W3C
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f172a" : "#ffffff"; // dark text for light bg, white text for dark bg
}

function parseNodeStyle(node: DiagramNode): NodeStyle {
  const style: NodeStyle = { ...DEFAULT_NODE_STYLE };
  const isCritical = isNodeCritical(node);

  // Use layer colors for the stroke to create a glowing border effect, keep fill dark
  if (!isCritical && DEFAULT_LAYER_COLORS[node.layer]) {
    style.stroke = DEFAULT_LAYER_COLORS[node.layer];
  } else if (isCritical) {
    style.stroke = DEFAULT_CRITICAL_COLOR;
    style.fill = "#450a0a"; // Subtle red tint for critical
  }

  const classes = node.classes;
  classes?.forEach((declaration) => {
    const [rawKey, ...rest] = declaration.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rest?.join(":").trim();
    if (!key || !value) return;

    if (key === "fill" && !isCritical) style.fill = value;
    else if (key === "stroke" && !isCritical) style.stroke = value;
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
    .attr("stroke-width", style.strokeWidth)
    .attr("filter", "url(#glow)");
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
          .attr("rx", 16)
          .attr("ry", 16),
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
  const { isD3Enabled, activeLayers, searchQuery } = useDiagram();
  const searchQueryRef = useRef(searchQuery ?? "");
  const updateSearchHighlightRef = useRef<(() => void) | null>(null);
  const activeLayersRef = useRef(activeLayers);
  const updateLayerVisibilityRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    activeLayersRef.current = activeLayers;
    updateLayerVisibilityRef.current?.();
  }, [activeLayers]);

  useEffect(() => {
    searchQueryRef.current = searchQuery ?? "";
    updateSearchHighlightRef.current?.();
  }, [searchQuery]);

  const selectedIdRef = useRef<string | null>(null);
  const tourSelectedIdRef = useRef<string | null>(null);

  const [selectedNode, setSelectedNode] = useState<DiagramNode | null>(null);
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const hasInitializedRef = useRef(false);

  const relations = useMemo(
    () => (systemGraph ? analyzeDiagramRelations(systemGraph) : {}),
    [systemGraph],
  );
  const getLinkOpacity = (d: DiagramLink) =>
    d.type === "fallback" ? 0.25 : 0.4;
  const getLinkTargetId = (d: DiagramLink) =>
    typeof d.target === "string" ? d.target : (d.target as DiagramNode).id;

  const walkthroughSteps = useMemo(
    () => (systemGraph ? buildDiagramWalkthroughSteps(systemGraph) : []),
    [systemGraph],
  );
  const [tourActive, setTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const applyTourStepRef = useRef<((nodeId: string) => void) | null>(null);
  const clearVisualStateRef = useRef<(() => void) | null>(null);

  // Use ResizeObserver to keep track of the container's dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use contentRect for accurate sizing
        const { width, height } = entry.contentRect;
        setDimensions((prev) => {
          if (
            Math.abs(prev.width - width) < 2 &&
            Math.abs(prev.height - height) < 2
          ) {
            return prev;
          }
          return { width, height };
        });
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

    // Define reusable SVG definitions (filters, patterns)
    const defs = svgSel.append("defs");

    // Background dot pattern
    defs
      .append("pattern")
      .attr("id", "bg-dots")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse")
      .append("circle")
      .attr("cx", 2)
      .attr("fill", "#ffffff")
      .attr("cy", 2)
      .attr("r", 1.5)
      .attr("opacity", 0.08);

    // Arrowhead marker
    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8) // Arrow tip is at x=10, so refX=8 places it perfectly at the end of the line
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "rgba(255, 255, 255, 0.6)")
      .style("stroke", "none");

    // Subtle glow filter
    const glowFilter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-30%")
      .attr("y", "-30%")
      .attr("width", "160%")
      .attr("height", "160%");

    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "8")
      .attr("result", "blur");

    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Add a background rect to hold the pattern
    svgSel
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "url(#bg-dots)")
      .attr("pointer-events", "none");

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

    const nodes: DiagramNode[] = systemGraph.nodes.map((node) => ({ ...node }));

    const links: DiagramLink[] = systemGraph.links.map((link) => ({ ...link }));

    const g = gZoom.append("g").attr("class", "d3-diagram");

    const link = g
      .selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "rgba(255, 255, 255, 0.5)")
      .attr("stroke-opacity", (d) => getLinkOpacity(d))
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", (d) => (d.type === "async" ? "6 4" : null))
      .attr("marker-end", "url(#arrowhead)");

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
        .attr("fill", getContrastColor(style.fill))
        .attr("font-weight", isNodeCritical(d) ? "bold" : "600")
        .attr("letter-spacing", "0.5px")
        .attr("pointer-events", "none");
    });

    const updateVisualState = () => {
      const tourNodeId = tourSelectedIdRef.current;
      const isTour = tourNodeId !== null;

      // Temporarily disable search query, visibility query and node selection for tours
      const query = isTour ? "" : searchQueryRef.current.trim().toLowerCase();
      const visibleLayers = new Set(
        isTour ? ALL_LAYERS : activeLayersRef.current,
      );
      const selectedId = tourNodeId ?? selectedIdRef.current;

      const upstream = new Set<string>();
      const downstream = new Set<string>();
      if (selectedId) {
        upstream.add(selectedId);
        downstream.add(selectedId);
        if (!isTour) {
          const rel = relations[selectedId];
          if (rel) {
            rel.ancestors.forEach((n) => upstream.add(n.id));
            rel.descendants.forEach((n) => downstream.add(n.id));
          }
        }
      }

      const onPath = (d: DiagramLink) => {
        if (isTour) return getLinkTargetId(d) === selectedId;
        const s = (d.source as DiagramNode).id;
        const t = (d.target as DiagramNode).id;
        return (
          (upstream.has(s) && upstream.has(t)) ||
          (downstream.has(s) && downstream.has(t))
        );
      };

      node
        .transition()
        .duration(250)
        .style("opacity", (d) => {
          if (!visibleLayers.has(d.layer)) return 0;
          let op = 1;
          if (query) {
            const text = `${d.label} ${d.id}`.toLowerCase();
            if (!text.includes(query)) op = 0.2;
          }
          if (selectedId) {
            if (!upstream.has(d.id) && !downstream.has(d.id)) op = 0.2;
          }
          return op;
        })
        .style("pointer-events", (d) =>
          isTour || !visibleLayers.has(d.layer) ? "none" : "auto",
        );

      node
        .selectAll<SVGElement, DiagramNode>("rect,circle,polygon,path")
        .transition()
        .duration(250)
        .style("stroke-width", function (d) {
          if (selectedId === d.id) return "4px";
          if (!query) return null;
          const text = `${d.label} ${d.id}`.toLowerCase();
          return text.includes(query) ? "3px" : null;
        });

      link
        .transition()
        .duration(250)
        .style("opacity", (d) => {
          const source = d.source as DiagramNode;
          const target = d.target as DiagramNode;
          if (
            !visibleLayers.has(source.layer) ||
            !visibleLayers.has(target.layer)
          ) {
            return 0;
          }
          if (selectedId) return onPath(d) ? 0.9 : 0.05;
          return getLinkOpacity(d);
        })
        .style("pointer-events", "none")
        .attr("stroke", (d) =>
          selectedId
            ? onPath(d)
              ? "rgba(255, 255, 255, 0.9)"
              : "rgba(255, 255, 255, 0.2)"
            : "rgba(255, 255, 255, 0.5)",
        )
        .attr("stroke-width", (d) => (selectedId && onPath(d) ? 3 : 2));
    };

    node.style("cursor", "pointer").on("click", (event, d) => {
      event.stopPropagation();
      selectedIdRef.current = d.id;
      setSelectedNode(d);
      setIsInsightOpen(true);
      updateVisualState();
    });

    svgSel.on("click", () => {
      selectedIdRef.current = null;
      setSelectedNode(null);
      setIsInsightOpen(false);
      updateVisualState();
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
      link.attr("d", (d: DiagramLink) => {
        const source = d.source as DiagramNode;
        const target = d.target as DiagramNode;
        const sx = source.x ?? 0;
        const sy = source.y ?? 0;
        let tx = target.x ?? 0;
        let ty = target.y ?? 0;

        let dx = tx - sx;
        let dy = ty - sy;
        const dr = Math.sqrt(dx * dx + dy * dy);

        // Handle self-referencing links
        if (dr === 0) {
          return `M${sx},${sy} A40,40 0 1,1 ${sx + 1},${sy + 1}`;
        }

        // Approximate target node boundary as an ellipse to prevent arrows from hiding underneath
        const tw = Math.max(90, (target.label?.length ?? 0) * 6 + 32); // Approximation of nodeWidth
        const th = 48; // DEFAULT_NODE_HEIGHT

        const angle = Math.atan2(dy, dx);
        const targetRadius =
          ((tw / 2) * th) /
          2 /
          Math.sqrt(
            Math.pow((th / 2) * Math.cos(angle), 2) +
              Math.pow((tw / 2) * Math.sin(angle), 2),
          );

        // Pull back the target point by the node's radius so the arrow sits exactly on the edge
        const padding = 2;
        const pullBack = targetRadius + padding;

        if (dr > pullBack) {
          tx = tx - (dx / dr) * pullBack;
          ty = ty - (dy / dr) * pullBack;
        }

        // Recalculate dx, dy for the curve
        dx = tx - sx;
        dy = ty - sy;

        // Use a smooth quadratic curve instead of an arc for a more predictable and aesthetic flow
        const cx = (sx + tx) / 2 - dy * 0.15;
        const cy = (sy + ty) / 2 + dx * 0.15;

        return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
      });

      node.attr(
        "transform",
        (d: DiagramNode) => `translate(${d.x ?? 0}, ${d.y ?? 0})`,
      );
    });

    simulation.on("end", () => {
      simulation.stop();
      // Fit to screen after initial stabilization, but only on the first run to avoid
      if (!hasInitializedRef.current) {
        fitToScreen({ padding: 28 });

        hasInitializedRef.current = true;
      }
    });

    const centerOnNode = (nodeId: string) => {
      const target = nodes.find((n) => n.id === nodeId);
      const svgSel = svgSelectionRef.current;
      if (
        !target ||
        target.x == null ||
        target.y == null ||
        !svgSel ||
        !zoomRef.current
      )
        return;

      const k = 1.5;
      const tx = dimensions.width / 2 - target.x * k;
      const ty = dimensions.height / 2 - target.y * k;
      const t = d3.zoomIdentity.translate(tx, ty).scale(k);
      svgSel.transition().duration(300).call(zoomRef.current.transform, t);
    };

    applyTourStepRef.current = (nodeId: string) => {
      tourSelectedIdRef.current = nodeId;
      updateVisualState();
      centerOnNode(nodeId);
    };
    clearVisualStateRef.current = () => {
      tourSelectedIdRef.current = null;
      updateVisualState();
    };

    updateSearchHighlightRef.current = updateVisualState;
    updateLayerVisibilityRef.current = updateVisualState;
    updateVisualState();

    // Clean up
    return () => {
      simulation.stop();
      updateSearchHighlightRef.current = null;
      updateLayerVisibilityRef.current = null;
      applyTourStepRef.current = null;
      clearVisualStateRef.current = null;
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

  const handleReset = useCallback(
    () => fitToScreen({ padding: 28, animate: true }),
    [fitToScreen],
  );

  const startTour = useCallback(() => {
    selectedIdRef.current = null;
    setSelectedNode(null);
    setIsInsightOpen(false);
    setTourStepIndex(0);
    setTourActive(true);
  }, []);

  const nextStep = useCallback(() => {
    setTourStepIndex((i) => Math.min(i + 1, walkthroughSteps.length - 1));
  }, [walkthroughSteps.length]);

  const prevStep = useCallback(() => {
    setTourStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const exitTour = useCallback(() => {
    setTourActive(false);
    clearVisualStateRef.current?.();
    handleReset();
  }, [handleReset]);

  useEffect(() => {
    if (!tourActive) return;
    const step = walkthroughSteps[tourStepIndex];
    if (step) applyTourStepRef.current?.(step.nodeId);
  }, [tourActive, tourStepIndex, walkthroughSteps]);

  useEffect(() => {
    if (!tourActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextStep();
      else if (e.key === "ArrowLeft") prevStep();
      else if (e.key === "Escape") exitTour();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourActive, nextStep, prevStep, exitTour]);

  if (!isD3Enabled) return null;

  return (
    <div
      ref={containerRef}
      className="w-full h-125 min-h-100 rounded-2xl border border-border/10 bg-[#0b0f19] overflow-hidden shadow-2xl relative flex items-center justify-center transition-all duration-500"
    >
      {/* Floating search input (top-right) */}
      <FloatingSearch position="right" disabled={tourActive} />
      {/* Layer Filters */}
      <LayerToggle disabled={tourActive} />
      {/* Guided walkthrough controls (bottom-center) */}
      <WalkthroughControls
        active={tourActive}
        index={tourStepIndex}
        total={walkthroughSteps.length}
        onStart={startTour}
        onPrev={prevStep}
        onNext={nextStep}
        onExit={exitTour}
      />
      {/* Floating viewport controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <div className="inline-flex rounded-full border border-slate-800 bg-[#0f172a]/80 backdrop-blur p-1 shadow-lg gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-full text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Zoom in"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-full text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Zoom out"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-full text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all font-medium"
            aria-label="Reset view"
            title="Reset View (Fit to Screen)"
          >
            <Maximize className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
      <svg
        ref={svgRef}
        className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
        preserveAspectRatio="xMidYMid meet"
      />

      <InsightPanel
        open={isInsightOpen}
        onOpenChange={setIsInsightOpen}
        node={selectedNode}
      />

      {/* Dev Mode Badge */}
      <div className="absolute top-4 right-4 translate-x-0 translate-y-12 px-2 py-1 bg-primary/10 border border-primary/20 rounded text-[10px] font-mono text-primary uppercase tracking-widest pointer-events-none">
        D3 Alpha
      </div>
    </div>
  );
}
