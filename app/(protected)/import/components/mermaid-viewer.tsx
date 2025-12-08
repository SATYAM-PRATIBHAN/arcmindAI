"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MermaidViewerProps {
  diagram: string;
  title?: string;
}

export function MermaidViewer({ diagram, title }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "inherit",
    });

    // Render diagram
    if (containerRef.current && diagram) {
      containerRef.current.innerHTML = "";
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

      mermaid
        .render(id, diagram)
        .then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
          }
        })
        .catch((error) => {
          console.error("Mermaid rendering error:", error);
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="text-destructive p-4 border border-destructive rounded">
                <p class="font-semibold">Failed to render diagram</p>
                <p class="text-sm mt-2">Error: ${error.message}</p>
              </div>
            `;
          }
        });
    }
  }, [diagram]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title || "System Architecture Diagram"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="w-full overflow-x-auto bg-background p-4 rounded-lg border"
        />
      </CardContent>
    </Card>
  );
}
