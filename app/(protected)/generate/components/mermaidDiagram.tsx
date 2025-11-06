// components/MermaidDiagram.tsx
"use client";

import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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

  const downloadAsImage = () => {
    if (!containerRef.current) return;

    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;

    // Get the SVG data
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });

    // Create download link
    const link = document.createElement("a");
    link.href = URL.createObjectURL(svgBlob);
    link.download = "architecture-diagram.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(link.href);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={downloadAsImage} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download as Image
        </Button>
      </div>
      <div ref={containerRef}></div>
    </div>
  );
};

export default MermaidDiagram;
