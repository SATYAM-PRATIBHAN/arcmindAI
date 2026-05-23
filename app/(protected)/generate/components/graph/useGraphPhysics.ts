// app/(protected)/generate/components/graph/useGraphPhysics.ts
"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { GraphNode, GraphLink, ParsedGraph } from "../../utils/parser";

interface UseGraphPhysicsProps {
  rawGraph: ParsedGraph;
  dimensions: { width: number; height: number };
  visibleLayers: Set<string>;
}

export function useGraphPhysics({
  rawGraph,
  dimensions,
  visibleLayers,
}: UseGraphPhysicsProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [simulation, setSimulation] = useState<d3.Simulation<
    GraphNode,
    GraphLink
  > | null>(null);

  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(
    null,
  );
  const nodesRef = useRef<GraphNode[]>([]);

  // Update nodesRef on every node state change
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    if (rawGraph.nodes.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNodes([]);
      setLinks([]);
      setSimulation(null);
      return;
    }

    // Filter nodes based on visible layers selection
    const filteredNodesList = rawGraph.nodes.filter((n) => {
      if (visibleLayers.size === 0) return true;
      return n.parentId ? visibleLayers.has(n.parentId) : true;
    });

    const filteredNodesSet = new Set(filteredNodesList.map((n) => n.id));

    // Filter links: keep links where both source and target nodes are visible
    const filteredLinksList = rawGraph.links.filter((l) => {
      const sourceId =
        typeof l.source === "object"
          ? (l.source as unknown as GraphNode).id
          : l.source;
      const targetId =
        typeof l.target === "object"
          ? (l.target as unknown as GraphNode).id
          : l.target;
      return filteredNodesSet.has(sourceId) && filteredNodesSet.has(targetId);
    });

    // Helper to determine the Y-tier
    const getNodeTier = (node: GraphNode): number => {
      const type = node.type;
      const label = node.label.toLowerCase();
      const parent = node.parentId ? node.parentId.toLowerCase() : "";

      // Databases (Tier 4)
      if (
        type === "database" ||
        label.includes("postgres") ||
        label.includes("neo4j") ||
        label.includes("mysql") ||
        label.includes("mongodb") ||
        label.includes("cassandra") ||
        label.includes("sqlite") ||
        label.includes("database") ||
        label.includes("db") ||
        parent.includes("data") ||
        parent.includes("db")
      ) {
        return 4;
      }

      // Infrastructure, queues, cache, storage, clusters (Tier 3)
      if (
        label.includes("rabbitmq") ||
        label.includes("kafka") ||
        label.includes("redis") ||
        label.includes("cache") ||
        label.includes("minio") ||
        label.includes("s3") ||
        label.includes("storage") ||
        label.includes("queue") ||
        label.includes("broker") ||
        label.includes("message-broker") ||
        label.includes("cluster") ||
        label.includes("kubernetes") ||
        label.includes("k8s") ||
        label.includes("monitoring") ||
        label.includes("prometheus") ||
        label.includes("grafana") ||
        label.includes("sentry") ||
        label.includes("logger") ||
        label.includes("elasticsearch") ||
        label.includes("opensearch") ||
        label.includes("notification") ||
        parent.includes("infrastructure") ||
        parent.includes("infra")
      ) {
        return 3;
      }

      // Clients (Tier 0)
      if (
        type === "client" ||
        label.includes("client") ||
        label.includes("frontend") ||
        label.includes("browser") ||
        label.includes("mobile") ||
        label.includes("app") ||
        label.includes("user interface") ||
        label.includes("cdn") ||
        parent.includes("client") ||
        parent.includes("frontend")
      ) {
        return 0;
      }

      // Gateways / Routing (Tier 1)
      if (
        type === "gateway" ||
        label.includes("gateway") ||
        label.includes("kong") ||
        label.includes("nginx") ||
        label.includes("load balancer") ||
        label.includes("proxy") ||
        label.includes("ingress") ||
        parent.includes("gateway") ||
        parent.includes("proxy")
      ) {
        return 1;
      }

      // Services (Tier 2)
      if (
        type === "service" ||
        label.includes("service") ||
        label.includes("api") ||
        label.includes("worker") ||
        label.includes("auth") ||
        parent.includes("service") ||
        parent.includes("backend")
      ) {
        return 2;
      }

      // Fallback default
      return 2;
    };

    // Y positioning percentage for each tier
    const tierYMap: Record<number, number> = {
      0: dimensions.height * 0.15,
      1: dimensions.height * 0.32,
      2: dimensions.height * 0.5,
      3: dimensions.height * 0.68,
      4: dimensions.height * 0.84,
    };

    // Group nodes by tier
    const nodesByTier: Record<number, GraphNode[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
    };

    filteredNodesList.forEach((n) => {
      const tier = getNodeTier(n);
      nodesByTier[tier].push(n);
    });

    const targetPositions = new Map<string, { x: number; y: number }>();

    // Margin/Padding for horizontal distribution: 12% on each side
    const marginX = dimensions.width * 0.12;
    const availableWidth = dimensions.width - 2 * marginX;

    Object.keys(nodesByTier).forEach((tierKey) => {
      const tier = parseInt(tierKey, 10);
      const tierNodes = nodesByTier[tier];
      // Sort alphabetically by ID for complete determinism
      tierNodes.sort((a, b) => a.id.localeCompare(b.id));

      const N = tierNodes.length;
      const targetY = tierYMap[tier];

      tierNodes.forEach((node, index) => {
        let targetX = dimensions.width / 2;
        if (N > 1) {
          targetX = marginX + (index * availableWidth) / (N - 1);
        }
        targetPositions.set(node.id, { x: targetX, y: targetY });
      });
    });

    // Preserving node positions when layout changes slightly, to prevent jumpiness
    const existingNodesMap = new Map<string, GraphNode>();
    nodesRef.current.forEach((n) => {
      existingNodesMap.set(n.id, n);
    });

    const simulatedNodes = filteredNodesList.map((n) => {
      const targets = targetPositions.get(n.id) || {
        x: dimensions.width / 2,
        y: dimensions.height / 2,
      };

      const existing = existingNodesMap.get(n.id);
      if (existing) {
        return {
          ...n,
          targetX: targets.x,
          targetY: targets.y,
          x: existing.x !== undefined ? existing.x : targets.x,
          y: existing.y !== undefined ? existing.y : targets.y,
          vx: existing.vx,
          vy: existing.vy,
          fx: existing.fx,
          fy: existing.fy,
        };
      }
      return {
        ...n,
        targetX: targets.x,
        targetY: targets.y,
        x: targets.x,
        y: targets.y,
        vx: 0,
        vy: 0,
      };
    });

    // Clone links
    const simulatedLinks = filteredLinksList.map((l) => ({ ...l }));

    // Stop previous simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create D3 Force Simulation with cooling parameters to prevent shaking/vibrating
    const sim = d3
      .forceSimulation<GraphNode>(simulatedNodes)
      .alphaDecay(0.05) // Higher decay for faster cooling and stability
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(simulatedLinks)
          .id((d) => d.id)
          .strength(0), // No physical pull, just resolves node references
      )
      .force("collide", d3.forceCollide<GraphNode>().radius(75).iterations(3)) // Prevent overlap
      .force(
        "x",
        d3
          .forceX<GraphNode>((d) => d.targetX ?? dimensions.width / 2)
          .strength(0.35),
      )
      .force(
        "y",
        d3
          .forceY<GraphNode>((d) => d.targetY ?? dimensions.height / 2)
          .strength(0.35),
      );

    simulationRef.current = sim;
    setSimulation(sim);

    // Use requestAnimationFrame to throttle state updates to prevent UI rendering bottlenecks
    let ticking = false;
    sim.on("tick", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setNodes([...simulatedNodes]);
          setLinks([...simulatedLinks]);
          ticking = false;
        });
      }
    });

    return () => {
      sim.stop();
    };
  }, [rawGraph, dimensions.width, dimensions.height, visibleLayers]);

  return {
    nodes,
    links,
    simulation,
  };
}
