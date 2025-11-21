// components/MermaidDiagram.tsx
"use client";

import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as htmlToImage from "html-to-image";

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

  const downloadAsImage = async () => {
    if (!containerRef.current) return;

    try {
      const dataUrl = await htmlToImage.toPng(containerRef.current, {
        backgroundColor: "#ffffff", // optional
        pixelRatio: 2, // for high-res
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "architecture-diagram.png";
      link.click();
    } catch (err) {
      console.error("Failed to export diagram:", err);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          className="cursor-pointer"
          onClick={downloadAsImage}
          variant="outline"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Download as Image
        </Button>
      </div>
      <div ref={containerRef}></div>
    </div>
  );
};

export default MermaidDiagram;
