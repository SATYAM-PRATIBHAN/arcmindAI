// app/(protected)/generate/components/graph/GraphUtils.tsx

import React from "react";
import {
  Globe,
  Settings,
  Cpu,
  Database as DbIcon,
  HelpCircle,
  Layers,
} from "lucide-react";
import { GraphNode } from "../../utils/parser";

export const nodeThemes: Record<
  GraphNode["type"],
  {
    bg: string;
    border: string;
    text: string;
    glow: string;
    icon: React.ReactNode;
  }
> = {
  client: {
    bg: "fill-cyan-500/10 hover:fill-cyan-500/20",
    border: "stroke-cyan-400/80",
    text: "fill-cyan-100",
    glow: "drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]",
    icon: <Globe className="w-4 h-4 text-cyan-400" />,
  },
  gateway: {
    bg: "fill-purple-500/10 hover:fill-purple-500/20",
    border: "stroke-purple-400/80",
    text: "fill-purple-100",
    glow: "drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]",
    icon: <Settings className="w-4 h-4 text-purple-400" />,
  },
  service: {
    bg: "fill-indigo-500/10 hover:fill-indigo-500/20",
    border: "stroke-indigo-400/80",
    text: "fill-indigo-100",
    glow: "drop-shadow-[0_0_8px_rgba(129,140,248,0.4)]",
    icon: <Cpu className="w-4 h-4 text-indigo-400" />,
  },
  database: {
    bg: "fill-amber-500/10 hover:fill-amber-500/20",
    border: "stroke-amber-400/80",
    text: "fill-amber-100",
    glow: "drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]",
    icon: <DbIcon className="w-4 h-4 text-amber-400" />,
  },
  decision: {
    bg: "fill-rose-500/10 hover:fill-rose-500/20",
    border: "stroke-rose-400/80",
    text: "fill-rose-100",
    glow: "drop-shadow-[0_0_8px_rgba(251,113,133,0.4)]",
    icon: <HelpCircle className="w-4 h-4 text-rose-400" />,
  },
  component: {
    bg: "fill-emerald-500/10 hover:fill-emerald-500/20",
    border: "stroke-emerald-400/80",
    text: "fill-emerald-100",
    glow: "drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]",
    icon: <Layers className="w-4 h-4 text-emerald-400" />,
  },
};

/**
 * Returns SVG path/shape matching component semantic type
 */
export function getNodeShape(type: string, w = 120, h = 50): React.ReactNode {
  switch (type) {
    case "database":
      return (
        <path
          d={`
            M ${-w / 2} ${-h / 2 + 8}
            A ${w / 2} 8 0 0 1 ${w / 2} ${-h / 2 + 8}
            L ${w / 2} ${h / 2 - 8}
            A ${w / 2} 8 0 0 1 ${-w / 2} ${h / 2 - 8}
            Z
            M ${-w / 2} ${-h / 2 + 8}
            A ${w / 2} 8 0 0 0 ${w / 2} ${-h / 2 + 8}
          `}
          className="stroke-[1.5px] transition-all duration-300"
        />
      );
    case "decision":
      return (
        <polygon
          points={`0,${-h / 2 - 10} ${w / 2 + 10},0 0,${h / 2 + 10} ${-w / 2 - 10},0`}
          className="stroke-[1.5px] transition-all duration-300"
        />
      );
    case "gateway":
      return (
        <polygon
          points={`
            ${-w / 2 + 12},${-h / 2} 
            ${w / 2 - 12},${-h / 2} 
            ${w / 2},0 
            ${w / 2 - 12},${h / 2} 
            ${-w / 2 + 12},${h / 2} 
            ${-w / 2},0
          `}
          className="stroke-[1.5px] transition-all duration-300"
        />
      );
    case "client":
      return (
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={h / 2}
          ry={h / 2}
          className="stroke-[1.5px] transition-all duration-300"
        />
      );
    case "service":
      return (
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={8}
          ry={8}
          className="stroke-[1.5px] transition-all duration-300"
        />
      );
    default:
      return (
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={4}
          ry={4}
          className="stroke-[1.5px] transition-all duration-300"
        />
      );
  }
}
