import { useCallback, useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

export function useMermaidRenderer(code: string) {
  const [renderError, setRenderError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "inherit",
    });
  }, []);

  const renderDiagram = useCallback(async () => {
    if (!diagramRef.current || !code.trim()) return;

    try {
      setRenderError(null);
      diagramRef.current.innerHTML = "";
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

      const { svg } = await mermaid.render(id, code);
      if (diagramRef.current) {
        diagramRef.current.innerHTML = svg;
      }
    } catch (error) {
      console.error("Mermaid rendering error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setRenderError(errorMessage);
      if (diagramRef.current) {
        diagramRef.current.innerHTML = `
          <div class="text-destructive p-4 border border-destructive rounded">
            <p class="font-semibold">Failed to render diagram</p>
            <p class="text-sm mt-2">Error: ${errorMessage}</p>
          </div>
        `;
      }
    }
  }, [code]);

  // Render diagram with debouncing
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(() => {
      renderDiagram();
    }, 500);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [renderDiagram]);

  return { diagramRef, renderError };
}
