// components/MermaidDiagram.tsx
"use client";

import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
}

// Initialize Mermaid once when the module loads
// We set startOnLoad to false because we will manually control rendering
try {
  mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
} catch (e) {
  console.error("Failed to initialize mermaid", e);
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const render = async () => {
      if (!containerRef.current) return;
      if (!chart || chart.trim().length === 0) {
        containerRef.current.innerHTML = "";
        return;
      }
      try {
        const id = `mermaid-diagram-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, chart);
        containerRef.current.innerHTML = svg;
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        containerRef.current.innerHTML = `<pre>${chart}</pre>`;
      }
    };
    render();
  }, [chart]);
  return <div ref={containerRef}></div>;
};

export default MermaidDiagram;
