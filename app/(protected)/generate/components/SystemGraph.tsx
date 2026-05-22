// app/(protected)/generate/components/SystemGraph.tsx
"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import * as d3 from "d3";
import { parseMermaidFlowchart, GraphNode } from "../utils/parser";
import { ArchitectureData } from "../utils/types";

// Component & Hook Imports
import Starfield from "./graph/Starfield";
import Minimap from "./graph/Minimap";
import StoryPlaybook, { Scenario } from "./graph/StoryPlaybook";
import GraphControls from "./graph/GraphControls";
import Sidebar from "./graph/Sidebar";
import GraphCanvas from "./graph/GraphCanvas";
import { useGraphPhysics } from "./graph/useGraphPhysics";

import {
  detectCycles,
  detectDeepChains,
  detectDatabaseBottlenecks,
  calculateHealthScore,
  SystemInsight,
  getLinkId,
} from "../utils/insights";

interface SystemGraphProps {
  chart: string;
  generatedData: ArchitectureData | null;
}

type TraceDirection = "none" | "upstream" | "downstream" | "full";

export default function SystemGraph({
  chart,
  generatedData,
}: SystemGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<
    SVGSVGElement,
    unknown
  > | null>(null);

  // Parsed Graph Data
  const rawGraph = useMemo(() => parseMermaidFlowchart(chart), [chart]);

  // Interactive UI States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomTransform, setZoomTransform] = useState<d3.ZoomTransform>(
    d3.zoomIdentity,
  );

  // Advanced HUD & Exploration States
  const [searchQuery, setSearchQuery] = useState("");
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [traceDirection, setTraceDirection] = useState<TraceDirection>("full");
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());

  // Story Mode States
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Insights Sidebar States
  const [showInsightsSidebar, setShowInsightsSidebar] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    "specs" | "insights"
  >("insights");
  const [selectedInsight, setSelectedInsight] = useState<SystemInsight | null>(
    null,
  );

  // Viewport Dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update container size on window resize
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      setDimensions({
        width: containerRef.current?.clientWidth || 800,
        height: 600,
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Run stable custom D3 Physics simulation hook
  const { nodes, links, simulation } = useGraphPhysics({
    rawGraph,
    dimensions,
    visibleLayers,
  });

  // Keep a stable reference of nodes for camera calculations to avoid tick dependency loops
  const nodesRef = useRef<GraphNode[]>([]);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Compute Degree Centrality & Critical Nodes
  const nodeDegrees = useMemo(() => {
    const degrees: Record<string, number> = {};
    rawGraph.nodes.forEach((n) => {
      degrees[n.id] = 0;
    });
    rawGraph.links.forEach((l) => {
      const s = getLinkId(l.source);
      const t = getLinkId(l.target);
      if (degrees[s] !== undefined) degrees[s]++;
      if (degrees[t] !== undefined) degrees[t]++;
    });
    return degrees;
  }, [rawGraph]);

  const maxDegree = useMemo(() => {
    const vals = Object.values(nodeDegrees);
    return vals.length > 0 ? Math.max(...vals) : 1;
  }, [nodeDegrees]);

  const criticalNodes = useMemo(() => {
    const critical = new Set<string>();
    Object.entries(nodeDegrees).forEach(([id, deg]) => {
      // If node is connected to at least 4 nodes, or connects to at least 50% of max degree
      if (deg >= 4 || (deg / maxDegree >= 0.5 && deg > 1)) {
        critical.add(id);
      }
    });
    return critical;
  }, [nodeDegrees, maxDegree]);

  // Zoom Control Utilities
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, 0.7);
  }, []);

  const handleResetZoom = useCallback(() => {
    if (
      !svgRef.current ||
      !zoomBehaviorRef.current ||
      nodesRef.current.length === 0
    )
      return;
    const currentNodes = nodesRef.current;
    const minX = Math.min(...currentNodes.map((n) => n.x || 0));
    const maxX = Math.max(...currentNodes.map((n) => n.x || 0));
    const minY = Math.min(...currentNodes.map((n) => n.y || 0));
    const maxY = Math.max(...currentNodes.map((n) => n.y || 0));

    const graphWidth = maxX - minX + 180;
    const graphHeight = maxY - minY + 180;
    const dx = maxX + minX;
    const dy = maxY + minY;

    const scale = Math.min(
      0.85,
      Math.min(dimensions.width / graphWidth, dimensions.height / graphHeight),
    );
    const tx = dimensions.width / 2 - (scale * dx) / 2;
    const ty = dimensions.height / 2 - (scale * dy) / 2;

    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale),
      );
  }, [dimensions]);

  // Center camera smoothly onto specific node ID
  const centerOnNode = useCallback(
    (nodeId: string, customScale = 1.25) => {
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (
        node &&
        node.x !== undefined &&
        node.y !== undefined &&
        svgRef.current &&
        zoomBehaviorRef.current
      ) {
        const scale = customScale;
        const tx = dimensions.width / 2 - scale * node.x;
        const ty = dimensions.height / 2 - scale * node.y;

        d3.select(svgRef.current)
          .transition()
          .duration(750)
          .call(
            zoomBehaviorRef.current.transform,
            d3.zoomIdentity.translate(tx, ty).scale(scale),
          );
      }
    },
    [dimensions],
  );

  // Upstream / Downstream Dependency Tracing Logic
  const tracePaths = useMemo(() => {
    if (!selectedNodeId) return null;

    const upstream = new Set<string>();
    const downstream = new Set<string>();

    const traverseUpstream = (nodeId: string) => {
      links.forEach((l) => {
        const s = getLinkId(l.source);
        const t = getLinkId(l.target);
        if (t === nodeId && !upstream.has(s)) {
          upstream.add(s);
          traverseUpstream(s);
        }
      });
    };

    const traverseDownstream = (nodeId: string) => {
      links.forEach((l) => {
        const s = getLinkId(l.source);
        const t = getLinkId(l.target);
        if (s === nodeId && !downstream.has(t)) {
          downstream.add(t);
          traverseDownstream(t);
        }
      });
    };

    traverseUpstream(selectedNodeId);
    traverseDownstream(selectedNodeId);

    return { upstream, downstream };
  }, [selectedNodeId, links]);

  // Combined Trace/Highlight Filter
  const highlightedNodes = useMemo(() => {
    if (!selectedNodeId) return null;
    const highlighted = new Set<string>([selectedNodeId]);

    if (!tracePaths) return highlighted;

    if (traceDirection === "full" || traceDirection === "upstream") {
      tracePaths.upstream.forEach((id) => highlighted.add(id));
    }
    if (traceDirection === "full" || traceDirection === "downstream") {
      tracePaths.downstream.forEach((id) => highlighted.add(id));
    }

    // Fallback: If trace direction is none, fall back to 1st degree neighbor highlight
    if (traceDirection === "none") {
      links.forEach((l) => {
        const s = getLinkId(l.source);
        const t = getLinkId(l.target);
        if (s === selectedNodeId) highlighted.add(t);
        if (t === selectedNodeId) highlighted.add(s);
      });
    }

    return highlighted;
  }, [selectedNodeId, tracePaths, traceDirection, links]);

  // Generate Scenarios dynamically from Parsed Graph (Story Mode)
  const scenarios = useMemo<Scenario[]>(() => {
    if (nodes.length === 0) return [];

    const list: Scenario[] = [];

    // Build adjacency mapping (source -> list of targets)
    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    nodes.forEach((n) => {
      adj[n.id] = [];
      inDegree[n.id] = 0;
    });

    links.forEach((l) => {
      const s = getLinkId(l.source);
      const t = getLinkId(l.target);
      if (adj[s] && adj[t]) {
        adj[s].push(t);
        inDegree[t]++;
      }
    });

    // Helper to generate step descriptions
    const makeStepDescription = (
      nodeId: string,
      label: string,
      type: string,
    ) => {
      if (generatedData) {
        if (type === "service") {
          const ms = generatedData.microservices?.find(
            (m) =>
              m.name.toLowerCase().includes(label.toLowerCase()) ||
              label.toLowerCase().includes(m.name.toLowerCase()),
          );
          if (ms) {
            return `Processes domain operations for ${label}. Responsibility: ${ms.responsibility}. Stack: ${ms.techStack.join(
              ", ",
            )}.`;
          }
        }
        if (type === "database") {
          const db = generatedData.databaseSchema;
          const colNames = db?.collections?.map((c) => c.name).join(", ");
          return `Saves persistent database state. Managed with ${
            db?.type || "SQL/NoSQL"
          }. Stores schemas: ${colNames || "Collections"}.`;
        }
      }

      switch (type) {
        case "client":
          return `Client user interface (${label}) initiates upstream HTTPS requests, handling frontend presentation, state rendering, and user input validation.`;
        case "gateway":
          return `API Gateway (${label}) acts as the single entrypoint for traffic. It handles cross-cutting concerns like rate limiting, routing, auth headers, and telemetry.`;
        case "service":
          return `Microservice (${label}) processes core functional logic. It processes inputs, queries databases, and communicates with sibling integrations.`;
        case "database":
          return `Data Store (${label}) manages persistent system schemas. Ensures transaction safety, indices, and highly available database records.`;
        case "decision":
          return `Conditional Decision node (${label}) evaluates request parameters and applies business rules to branch transaction flows.`;
        default:
          return `Architectural component (${label}) integrates downstream dependencies, caches responses, or handles event messaging.`;
      }
    };

    // Find paths from client/gateway/inDegree=0 nodes to database/decision/outDegree=0 nodes
    const paths: string[][] = [];

    const dfs = (curr: string, currentPath: string[]) => {
      if (currentPath.length >= 6) {
        paths.push([...currentPath]);
        return;
      }
      const neighbors = adj[curr] || [];
      if (neighbors.length === 0) {
        paths.push([...currentPath]);
        return;
      }

      let branched = false;
      for (const nxt of neighbors) {
        if (!currentPath.includes(nxt)) {
          branched = true;
          dfs(nxt, [...currentPath, nxt]);
        }
      }
      if (!branched) {
        paths.push([...currentPath]);
      }
    };

    const startNodes = nodes.filter(
      (n) =>
        inDegree[n.id] === 0 || n.type === "client" || n.type === "gateway",
    );
    startNodes.forEach((n) => {
      dfs(n.id, [n.id]);
    });

    // Deduplicate and filter paths (keep paths of length >= 2)
    const uniquePaths = paths.filter((p, index) => {
      if (p.length < 2) return false;
      const key = p.join("->");
      return paths.findIndex((x) => x.join("->") === key) === index;
    });

    // Limit to top 3 paths to keep UI elegant
    uniquePaths.slice(0, 3).forEach((path, pathIdx) => {
      const startNode = nodes.find((n) => n.id === path[0]);
      const endNode = nodes.find((n) => n.id === path[path.length - 1]);

      const steps = path.map((nodeId, stepIdx) => {
        const node = nodes.find((n) => n.id === nodeId)!;
        let stepTitle = "";
        if (stepIdx === 0) stepTitle = `Request Initiated at ${node.label}`;
        else if (stepIdx === path.length - 1)
          stepTitle = `Persistence & Output at ${node.label}`;
        else stepTitle = `Request Processed by ${node.label}`;

        return {
          nodeId,
          title: stepTitle,
          description: makeStepDescription(nodeId, node.label, node.type),
        };
      });

      list.push({
        name: `Transaction Flow ${pathIdx + 1}: ${startNode?.label} ➔ ${endNode?.label}`,
        description: `Visual walkthrough of a data transaction path from ${startNode?.label} down to ${endNode?.label}.`,
        steps,
      });
    });

    // Add a default "Architecture Tour" scenario walking through all nodes by centrality
    const sortedByCentrality = [...nodes].sort(
      (a, b) => (nodeDegrees[b.id] || 0) - (nodeDegrees[a.id] || 0),
    );
    const tourSteps = sortedByCentrality.map((node, index) => {
      let role = "Core Dependency";
      if (index === 0) role = "Primary System Bottleneck";
      else if (node.type === "database") role = "Storage Layer";
      else if (node.type === "client") role = "Entrypoint Client";

      return {
        nodeId: node.id,
        title: `${role}: ${node.label}`,
        description: makeStepDescription(node.id, node.label, node.type),
      };
    });

    list.push({
      name: "Complete Architecture Tour",
      description:
        "Step-by-step discovery of all system components ordered by degree centrality.",
      steps: tourSteps,
    });

    return list;
  }, [nodes, links, nodeDegrees, generatedData]);

  // Active Story Mode Traversal Info
  const storyActiveInfo = useMemo(() => {
    if (!isStoryMode || !scenarios[currentScenarioIndex]) return null;
    const scenario = scenarios[currentScenarioIndex];
    const activeSteps = scenario.steps.slice(0, currentStepIndex + 1);
    const activeNodeIds = new Set(activeSteps.map((s) => s.nodeId));
    const currentNodeId = scenario.steps[currentStepIndex]?.nodeId || null;

    // Find active links: links connecting consecutive nodes in activeSteps
    const activeLinks = new Set<string>();
    for (let i = 0; i < activeSteps.length - 1; i++) {
      const sId = activeSteps[i].nodeId;
      const tId = activeSteps[i + 1].nodeId;
      activeLinks.add(`${sId}->${tId}`);
    }

    const currentIncomingLinkKey =
      currentStepIndex > 0
        ? `${scenario.steps[currentStepIndex - 1].nodeId}->${currentNodeId}`
        : null;

    return {
      activeNodeIds,
      currentNodeId,
      activeLinks,
      currentIncomingLinkKey,
    };
  }, [isStoryMode, currentScenarioIndex, currentStepIndex, scenarios]);

  // Story Mode Camera Centering Effect
  useEffect(() => {
    if (isStoryMode && scenarios[currentScenarioIndex]) {
      const activeStep =
        scenarios[currentScenarioIndex].steps[currentStepIndex];
      if (activeStep) {
        centerOnNode(activeStep.nodeId, 1.35);
      }
    }
  }, [
    currentStepIndex,
    currentScenarioIndex,
    isStoryMode,
    scenarios,
    centerOnNode,
  ]);

  // Story Mode Autoplay Timer Effect
  useEffect(() => {
    if (!isStoryMode || !isPlaying) return;

    const scenario = scenarios[currentScenarioIndex];
    if (!scenario) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < scenario.steps.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return 0;
        }
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isStoryMode, isPlaying, currentScenarioIndex, scenarios]);

  // Fuzzy Search filter results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return rawGraph.nodes
      .filter(
        (n) =>
          n.label.toLowerCase().includes(query) ||
          n.id.toLowerCase().includes(query),
      )
      .slice(0, 5);
  }, [searchQuery, rawGraph.nodes]);

  // Heatmap Thermal Gradient colors
  const getHeatmapColorClasses = useCallback(
    (nodeId: string) => {
      const deg = nodeDegrees[nodeId] || 0;
      const ratio = deg / maxDegree;

      if (ratio >= 0.75) {
        // Hot: Red overlay
        return {
          bg: "fill-red-950/65",
          border: "stroke-red-500",
          text: "fill-red-100",
          glow: "drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]",
        };
      } else if (ratio >= 0.4) {
        // Warm: Amber overlay
        return {
          bg: "fill-amber-950/50",
          border: "stroke-amber-500",
          text: "fill-amber-100",
          glow: "drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]",
        };
      } else {
        // Cool: Blue overlay
        return {
          bg: "fill-cyan-950/40",
          border: "stroke-cyan-500/80",
          text: "fill-cyan-100",
          glow: "drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]",
        };
      }
    },
    [nodeDegrees, maxDegree],
  );

  // Insights / Vulnerability detection algorithms
  const detectedCycles = useMemo(
    () => detectCycles(rawGraph.nodes, rawGraph.links),
    [rawGraph.nodes, rawGraph.links],
  );

  const cyclicNodeIds = useMemo(() => {
    const ids = new Set<string>();
    detectedCycles.forEach((cycle) => {
      cycle.forEach((id) => ids.add(id));
    });
    return ids;
  }, [detectedCycles]);

  const detectedDeepChains = useMemo(
    () => detectDeepChains(rawGraph.nodes, rawGraph.links),
    [rawGraph.nodes, rawGraph.links],
  );

  const detectedDbBottlenecks = useMemo(
    () => detectDatabaseBottlenecks(rawGraph.nodes, rawGraph.links),
    [rawGraph.nodes, rawGraph.links],
  );

  const detectedSpofs = useMemo(() => {
    return rawGraph.nodes.filter((n) => {
      return (
        criticalNodes.has(n.id) &&
        (n.type === "service" || n.type === "gateway" || n.type === "component")
      );
    });
  }, [rawGraph.nodes, criticalNodes]);

  const detectedIsolated = useMemo(() => {
    return rawGraph.nodes.filter((n) => {
      const deg = nodeDegrees[n.id] || 0;
      return deg === 0;
    });
  }, [rawGraph.nodes, nodeDegrees]);

  // Unified Insights List
  const systemInsights = useMemo<SystemInsight[]>(() => {
    const list: SystemInsight[] = [];

    // 1. Cycles (Critical)
    detectedCycles.forEach((cycle, idx) => {
      const affectedLinks: string[] = [];
      for (let i = 0; i < cycle.length; i++) {
        const s = cycle[i];
        const t = cycle[(i + 1) % cycle.length];
        affectedLinks.push(`${s}->${t}`);
      }
      const nodeNames = cycle
        .map((id) => rawGraph.nodes.find((n) => n.id === id)?.label || id)
        .join(" ➔ ");
      list.push({
        id: `cycle-${idx}`,
        type: "cycle",
        severity: "critical",
        title: "Cyclic Dependency Detected",
        description: `A closed dependency loop was found: ${nodeNames}. This can trigger deadlocks, infinite recursion, and distributed cascading failures.`,
        affectedNodes: cycle,
        affectedLinks,
      });
    });

    // 2. Deep Synchronous Chains (Warning)
    detectedDeepChains.forEach((chain, idx) => {
      const affectedLinks: string[] = [];
      for (let i = 0; i < chain.length - 1; i++) {
        affectedLinks.push(`${chain[i]}->${chain[i + 1]}`);
      }
      const nodeNames = chain
        .map((id) => rawGraph.nodes.find((n) => n.id === id)?.label || id)
        .join(" ➔ ");
      list.push({
        id: `deep-chain-${idx}`,
        type: "deep-chain",
        severity: "warning",
        title: "Excessive Deep Synchronous Chain",
        description: `Deep request pathway detected: ${nodeNames} (${
          chain.length - 1
        } hops). Excessive synchronous chains increase request latency, couple services tightly, and cascade timeouts.`,
        affectedNodes: chain,
        affectedLinks,
      });
    });

    // 3. Database Bottlenecks (Warning)
    detectedDbBottlenecks.forEach((bottleneck, idx) => {
      const dbLabel =
        rawGraph.nodes.find((n) => n.id === bottleneck.dbId)?.label ||
        bottleneck.dbId;
      const affectedNodes = [bottleneck.dbId, ...bottleneck.sources];
      const affectedLinks = bottleneck.sources.map(
        (src) => `${src}->${bottleneck.dbId}`,
      );
      list.push({
        id: `db-bottleneck-${idx}`,
        type: "db-bottleneck",
        severity: "warning",
        title: "Database Contention Risk",
        description: `Database "${dbLabel}" is accessed directly by ${bottleneck.sources.length} microservices. Direct DB contention bypasses domain boundaries and risks connection pool exhaustion.`,
        affectedNodes,
        affectedLinks,
      });
    });

    // 4. Single Points of Failure (Optimization)
    detectedSpofs.forEach((node, idx) => {
      const deg = nodeDegrees[node.id] || 0;
      const affectedLinks: string[] = [];
      rawGraph.links.forEach((l) => {
        const s = getLinkId(l.source);
        const t = getLinkId(l.target);
        if (s === node.id || t === node.id) {
          affectedLinks.push(`${s}->${t}`);
        }
      });

      list.push({
        id: `spof-${idx}`,
        type: "spof",
        severity: "optimization",
        title: `Single Point of Failure: ${node.label}`,
        description: `"${node.label}" has very high central connectivity (${deg} links). A network failure or load spike on this node will partition the system.`,
        affectedNodes: [node.id],
        affectedLinks,
      });
    });

    // 5. Isolated Nodes (Optimization)
    detectedIsolated.forEach((node, idx) => {
      list.push({
        id: `isolated-${idx}`,
        type: "isolated",
        severity: "optimization",
        title: `Isolated Node: ${node.label}`,
        description: `Component "${node.label}" is completely disconnected. Check if it's an orphaned configuration or needs link integration.`,
        affectedNodes: [node.id],
        affectedLinks: [],
      });
    });

    return list;
  }, [
    detectedCycles,
    detectedDeepChains,
    detectedDbBottlenecks,
    detectedSpofs,
    detectedIsolated,
    rawGraph,
    nodeDegrees,
  ]);

  // Health Score Calculations
  const healthScoreInfo = useMemo(
    () => calculateHealthScore(systemInsights),
    [systemInsights],
  );

  // Multiselect layer filter methods
  const toggleLayerVisibility = useCallback((layerId: string) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  const clearLayerFilters = useCallback(() => {
    setVisibleLayers(new Set());
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[650px] rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-md overflow-hidden shadow-2xl flex"
    >
      {/* ── BACKGROUND GLOWS ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse duration-10000" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse duration-7000" />
        <div className="absolute top-1/2 right-1/3 w-[250px] h-[250px] rounded-full bg-purple-500/5 blur-[80px]" />
      </div>

      {/* ── CANVAS STARFIELD BACKGROUND ── */}
      <Starfield
        zoomTransform={zoomTransform}
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* ── STYLE SHEET FOR TRAVERSAL FLOW ANIMATIONS ── */}
      <style>{`
        @keyframes dashflow {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-flow-line {
          animation: dashflow 1s linear infinite;
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.4;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
        .pulse-effect {
          animation: pulse-ring 2.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
        }
      `}</style>

      {/* ── HUD CONTROLS OVERLAY ── */}
      <GraphControls
        subgraphs={rawGraph.subgraphs}
        visibleLayers={visibleLayers}
        toggleLayerVisibility={toggleLayerVisibility}
        clearLayerFilters={clearLayerFilters}
        heatmapMode={heatmapMode}
        setHeatmapMode={setHeatmapMode}
        isStoryMode={isStoryMode}
        setIsStoryMode={setIsStoryMode}
        showInsightsSidebar={showInsightsSidebar}
        setShowInsightsSidebar={setShowInsightsSidebar}
        activeSidebarTab={activeSidebarTab}
        setActiveSidebarTab={setActiveSidebarTab}
        setSelectedNodeId={setSelectedNodeId}
        setCurrentStepIndex={setCurrentStepIndex}
        setIsPlaying={setIsPlaying}
        setSelectedInsight={setSelectedInsight}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleResetZoom={handleResetZoom}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        centerOnNode={centerOnNode}
      />

      {/* ── CORE WORKSPACE GRAPH CANVAS ── */}
      <GraphCanvas
        chart={chart}
        nodes={nodes}
        links={links}
        subgraphs={rawGraph.subgraphs}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
        hoveredNodeId={hoveredNodeId}
        setHoveredNodeId={setHoveredNodeId}
        zoomTransform={zoomTransform}
        setZoomTransform={setZoomTransform}
        svgRef={svgRef}
        zoomBehaviorRef={zoomBehaviorRef}
        traceDirection={traceDirection}
        tracePaths={tracePaths}
        highlightedNodes={highlightedNodes}
        storyActiveInfo={storyActiveInfo}
        selectedInsight={selectedInsight}
        setSelectedInsight={setSelectedInsight}
        isStoryMode={isStoryMode}
        currentScenarioIndex={currentScenarioIndex}
        setCurrentStepIndex={setCurrentStepIndex}
        setIsPlaying={setIsPlaying}
        scenarios={scenarios}
        heatmapMode={heatmapMode}
        getHeatmapColorClasses={getHeatmapColorClasses}
        cyclicNodeIds={cyclicNodeIds}
        criticalNodes={criticalNodes}
        dimensions={dimensions}
        simulation={simulation}
        setActiveSidebarTab={setActiveSidebarTab}
      />

      {/* ── MINIMAP COMPONENT ── */}
      <Minimap
        nodes={nodes}
        criticalNodes={criticalNodes}
        heatmapMode={heatmapMode}
        nodeDegrees={nodeDegrees}
        maxDegree={maxDegree}
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* ── STORY PLAYBACK CONTROLLERS ── */}
      <StoryPlaybook
        isStoryMode={isStoryMode}
        setIsStoryMode={setIsStoryMode}
        scenarios={scenarios}
        currentScenarioIndex={currentScenarioIndex}
        setCurrentScenarioIndex={setCurrentScenarioIndex}
        currentStepIndex={currentStepIndex}
        setCurrentStepIndex={setCurrentStepIndex}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      {/* ── GLASSMORPHIC INSIGHTS/DETAILS SIDEBAR ── */}
      <Sidebar
        showInsightsSidebar={showInsightsSidebar}
        setShowInsightsSidebar={setShowInsightsSidebar}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
        activeSidebarTab={activeSidebarTab}
        setActiveSidebarTab={setActiveSidebarTab}
        traceDirection={traceDirection}
        setTraceDirection={setTraceDirection}
        criticalNodes={criticalNodes}
        nodeDegrees={nodeDegrees}
        subgraphs={rawGraph.subgraphs}
        systemInsights={systemInsights}
        healthScoreInfo={healthScoreInfo}
        selectedInsight={selectedInsight}
        setSelectedInsight={setSelectedInsight}
        centerOnNode={centerOnNode}
        nodes={nodes}
        generatedData={generatedData}
      />
    </div>
  );
}
