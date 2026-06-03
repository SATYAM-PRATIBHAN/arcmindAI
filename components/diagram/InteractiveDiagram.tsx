"use client";

import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { useDiagram } from "@/lib/contexts/DiagramContext";

/**
 * InteractiveDiagram component initializes a D3 workspace that scales to its parent container.
 * This is the base component for the Stream 2 Core Rendering Engine milestone.
 */
export default function InteractiveDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { isD3Enabled } = useDiagram();

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

  // Initialize and update the SVG viewBox and force-directed graph
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0)
      return;

    const svg = d3.select(svgRef.current);

    // Update viewBox dynamically to match dimensions
    svg.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

    // Clear previous elements before rendering the force-directed graph
    svg.selectAll("*").remove();

    // Temporary graph data used to validate the D3 force simulation.
    // This will be replaced by actual architecture nodes in future diagram-rendering tasks.
    type DiagramNode = d3.SimulationNodeDatum & {
      id: string;
    };
    type DiagramLink = d3.SimulationLinkDatum<DiagramNode>;
    const nodes: DiagramNode[] = [
      { id: "Frontend" },
      { id: "CDN" },
      { id: "Load Balancer" },
      { id: "API Gateway" },
      { id: "Auth Service" },
      { id: "Backend" },
      { id: "Notification Service" },
      { id: "Database" },
      { id: "Cache" },
      { id: "Queue" },
      { id: "Worker" },
      { id: "Object Storage" },
      { id: "Third-Party API" },
      { id: "Monitoring" },
    ];

    const links: DiagramLink[] = [
      { source: "Frontend", target: "CDN" },
      { source: "Frontend", target: "Load Balancer" },

      { source: "Load Balancer", target: "API Gateway" },

      { source: "API Gateway", target: "Auth Service" },
      { source: "API Gateway", target: "Backend" },

      { source: "Auth Service", target: "Database" },
      { source: "Auth Service", target: "Monitoring" },

      { source: "Backend", target: "Database" },
      { source: "Backend", target: "Cache" },
      { source: "Backend", target: "Queue" },
      { source: "Backend", target: "Object Storage" },
      { source: "Backend", target: "Notification Service" },
      { source: "Backend", target: "Third-Party API" },
      { source: "Backend", target: "Monitoring" },

      { source: "Worker", target: "Queue" },
      { source: "Worker", target: "Database" },
      { source: "Worker", target: "Object Storage" },
      { source: "Worker", target: "Monitoring" },

      { source: "Notification Service", target: "Third-Party API" },
      { source: "Notification Service", target: "Monitoring" },
    ];

    const g = svg.append("g");

    const link = g
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 2);

    const node = g
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 20)
      .attr("fill", "currentColor")
      .attr("opacity", 0.8);

    const label = g
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d) => d.id)
      .attr("font-size", 12)
      .attr("text-anchor", "middle")
      .attr("dy", 35)
      .attr("fill", "currentColor");

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
      .force("collision", d3.forceCollide(60))
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

      node
        .attr("cx", (d: DiagramNode) => d.x ?? 0)
        .attr("cy", (d: DiagramNode) => d.y ?? 0);

      label
        .attr("x", (d: DiagramNode) => d.x ?? 0)
        .attr("y", (d: DiagramNode) => d.y ?? 0);
    });

    simulation.on("end", () => {
      simulation.stop();
    });

    // Clean up the simulation on unmount
    return () => {
      simulation.stop();
    };
  }, [dimensions]);

  if (!isD3Enabled) return null;

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] min-h-[400px] rounded-2xl border border-border/40 bg-card/30 overflow-hidden backdrop-blur-sm shadow-inner relative flex items-center justify-center transition-all duration-500"
    >
      <svg
        ref={svgRef}
        className="w-full h-full block touch-none"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Dev Mode Badge */}
      <div className="absolute top-4 right-4 px-2 py-1 bg-primary/10 border border-primary/20 rounded text-[10px] font-mono text-primary uppercase tracking-widest pointer-events-none">
        D3 Alpha
      </div>
    </div>
  );
}
