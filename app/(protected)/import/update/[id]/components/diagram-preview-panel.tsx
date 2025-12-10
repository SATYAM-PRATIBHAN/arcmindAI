"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";

interface DiagramPreviewPanelProps {
  diagramRef: React.RefObject<HTMLDivElement | null>;
  renderError: string | null;
  onOpenAIDialog: () => void;
}

export function DiagramPreviewPanel({
  diagramRef,
  renderError,
  onOpenAIDialog,
}: DiagramPreviewPanelProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Center diagram on load or update
  const centerDiagram = useCallback(() => {
    if (!containerRef.current || !diagramRef.current) return;

    const container = containerRef.current;
    const diagram = diagramRef.current;

    const containerRect = container.getBoundingClientRect();
    const diagramRect = diagram.getBoundingClientRect();

    const centerX = (containerRect.width - diagramRect.width) / 2;
    const centerY = (containerRect.height - diagramRect.height) / 2;

    setPosition({ x: centerX, y: centerY });
    setScale(1);
  }, [diagramRef]);

  // Auto center on diagram change
  useEffect(() => {
    if (!diagramRef.current) return;

    const observer = new MutationObserver(() => {
      setTimeout(centerDiagram, 100);
    });

    observer.observe(diagramRef.current, {
      childList: true,
      subtree: true,
    });

    setTimeout(centerDiagram, 100);

    return () => observer.disconnect();
  }, [diagramRef, centerDiagram]);

  // 🔍 Zoom controls (buttons, keyboard, touchpad)
  const zoomIn = useCallback(() => setScale((s) => Math.min(s + 0.2, 6)), []);
  const zoomOut = useCallback(
    () => setScale((s) => Math.max(s - 0.2, 0.5)),
    []
  );
  const resetView = () => centerDiagram();

  // ⌨️ Keyboard shortcuts (Ctrl/Cmd +/-) - only when focused and not on mobile
  useEffect(() => {
    // Skip keyboard shortcuts on mobile devices
    if (isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when the diagram container is focused
      if (!isFocused) return;

      // Check for Ctrl (Windows/Linux) or Cmd (Mac)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          zoomIn();
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          zoomOut();
        } else if (e.key === "0") {
          e.preventDefault();
          resetView();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomIn, zoomOut, resetView, isFocused, isMobile]);

  // 🖱️ Drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // 🎯 Touchpad gestures (pinch-to-zoom, two-finger pan)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    // Pinch-to-zoom (Ctrl/Cmd + scroll)
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1.1 : 0.9;
      setScale((s) => Math.min(Math.max(s * zoomFactor, 0.5), 6));
    } else {
      // Two-finger pan (scroll without Ctrl/Cmd)
      setPosition((pos) => ({
        x: pos.x - e.deltaX,
        y: pos.y - e.deltaY,
      }));
    }
  }, []);

  // Attach wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // 📱 Touch gestures for mobile (pinch-to-zoom, drag)
  const touchStartRef = useRef<{
    x: number;
    y: number;
    distance: number;
  } | null>(null);

  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single finger - prepare for drag
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    } else if (e.touches.length === 2) {
      // Two fingers - prepare for pinch zoom
      setIsDragging(false);
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      touchStartRef.current = { x: centerX, y: centerY, distance };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while interacting with diagram

    if (e.touches.length === 1 && isDragging) {
      // Single finger drag
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && touchStartRef.current) {
      // Two finger pinch zoom
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const scaleDelta = distance / touchStartRef.current.distance;
      setScale((s) => Math.min(Math.max(s * scaleDelta, 0.5), 6));
      touchStartRef.current.distance = distance;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current = null;
  };

  return (
    <Card className="h-full border-0 rounded-none flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          Preview
          {renderError && (
            <span className="text-destructive text-sm font-normal">
              (Syntax Error)
            </span>
          )}
        </CardTitle>

        {/* Zoom Controls */}
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={zoomOut}>
            <Minus className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={zoomIn}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={resetView}>
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden px-4 relative">
        <div
          ref={containerRef}
          tabIndex={0}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`w-full h-full overflow-hidden bg-background p-2 rounded-lg border ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          } ${isFocused ? "ring-2 ring-primary ring-offset-2" : ""}`}
          style={{ touchAction: "none" }}
        >
          <div
            ref={diagramRef}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: "top left",
              transition: isDragging ? "none" : "transform 0.2s ease-out",
            }}
            className="inline-block"
          />
        </div>
        {!isFocused && !isMobile && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded border pointer-events-none">
            Click to enable keyboard shortcuts (Ctrl/Cmd +/-)
          </div>
        )}
      </CardContent>

      <div className="px-4 pb-4">
        <Button className="w-full cursor-pointer" onClick={onOpenAIDialog}>
          Use AI to Improve
        </Button>
      </div>
    </Card>
  );
}
