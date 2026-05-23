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

    // Preserving node positions when layout changes slightly, to prevent jumpiness
    const existingNodesMap = new Map<string, GraphNode>();
    nodesRef.current.forEach((n) => {
      existingNodesMap.set(n.id, n);
    });

    const simulatedNodes = filteredNodesList.map((n) => {
      const existing = existingNodesMap.get(n.id);
      if (existing) {
        return {
          ...n,
          x: existing.x,
          y: existing.y,
          vx: existing.vx,
          vy: existing.vy,
          fx: existing.fx,
          fy: existing.fy,
        };
      }
      return { ...n };
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
      .alphaDecay(0.025) // Stable cooling parameters
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(simulatedLinks)
          .id((d) => d.id)
          .distance(120), // More compact service distance
      )
      .force("charge", d3.forceManyBody().strength(-300)) // Reduced repulsion for closer grouping
      .force("collide", d3.forceCollide().radius(70).iterations(3)) // Robust overlap prevention
      .force(
        "center",
        d3.forceCenter(dimensions.width / 2, dimensions.height / 2),
      )
      .force("x", d3.forceX(dimensions.width / 2).strength(0.08)) // Stronger horizontal centering to prevent stretching
      .force(
        "y",
        d3
          .forceY<GraphNode>((d) => {
            const type = d.type;
            if (type === "client") return dimensions.height * 0.16;
            if (type === "gateway") return dimensions.height * 0.35;
            if (type === "service") return dimensions.height * 0.54;
            if (type === "database") return dimensions.height * 0.78;

            // Align logging, monitoring, and infrastructure support systems at the bottom
            const label = d.label.toLowerCase();
            if (
              label.includes("monitoring") ||
              label.includes("logger") ||
              label.includes("prometheus") ||
              label.includes("sentry") ||
              label.includes("telemetry") ||
              label.includes("notification")
            ) {
              return dimensions.height * 0.82;
            }
            return dimensions.height * 0.54;
          })
          .strength(0.22), // High strength to enforce stable vertical layers
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
