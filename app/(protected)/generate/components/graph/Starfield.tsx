// app/(protected)/generate/components/graph/Starfield.tsx
"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface StarfieldProps {
  zoomTransform: d3.ZoomTransform;
  width: number;
  height: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  depth: number; // For parallax effect: 0.1 to 0.8
  twinkleSpeed: number;
  phase: number;
}

export const Starfield: React.FC<StarfieldProps> = ({
  zoomTransform,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize stars once or on canvas dimensions change
  useEffect(() => {
    const starCount = Math.floor((width * height) / 4500); // density
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        depth: Math.random() * 0.7 + 0.1, // speed scalar
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2,
      });
    }
    starsRef.current = stars;
  }, [width, height]);

  // Handle render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Render stars
      starsRef.current.forEach((star) => {
        // Update twinkle phase
        star.phase += star.twinkleSpeed;
        const opacity = 0.35 + Math.sin(star.phase) * 0.45;

        // Apply parallax offset based on zoomTransform
        // As k increases, stars zoom slightly
        const offsetX = (zoomTransform.x * star.depth) % width;
        const offsetY = (zoomTransform.y * star.depth) % height;

        let sx = (star.x + offsetX) % width;
        let sy = (star.y + offsetY) % height;

        if (sx < 0) sx += width;
        if (sy < 0) sy += height;

        // Draw star
        ctx.fillStyle = `rgba(224, 231, 255, ${opacity * (0.6 + star.depth * 0.4)})`;
        ctx.beginPath();
        ctx.arc(
          sx,
          sy,
          star.size * (0.8 + (zoomTransform.k - 1) * 0.15),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    // Start loop
    render();

    // Clean up loop on unmount or dimension change
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [zoomTransform, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500"
      style={{ mixBlendMode: "screen" }}
    />
  );
};
export default Starfield;
