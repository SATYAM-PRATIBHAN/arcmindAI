// app/(protected)/generate/utils/insights.ts

import { GraphNode, GraphLink } from "./parser";

export interface SystemInsight {
  id: string;
  type: "cycle" | "deep-chain" | "db-bottleneck" | "spof" | "isolated";
  severity: "critical" | "warning" | "optimization";
  title: string;
  description: string;
  affectedNodes: string[];
  affectedLinks: string[];
}

export function getLinkId(
  nodeRef: string | GraphNode | null | undefined,
): string {
  if (typeof nodeRef === "object" && nodeRef !== null) {
    return nodeRef.id || "";
  }
  return String(nodeRef || "");
}

/**
 * Detect cycles in the directed graph using Depth First Search (DFS)
 */
export function detectCycles(
  nodes: GraphNode[],
  links: GraphLink[],
): string[][] {
  if (nodes.length === 0) return [];

  const adj: Record<string, string[]> = {};
  nodes.forEach((n) => {
    adj[n.id] = [];
  });
  links.forEach((l) => {
    const s = getLinkId(l.source);
    const t = getLinkId(l.target);
    if (adj[s] && adj[t]) {
      adj[s].push(t);
    }
  });

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  const dfs = (nodeId: string) => {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adj[nodeId] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recStack.has(neighbor)) {
        const cycleStartIndex = path.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          cycles.push(path.slice(cycleStartIndex));
        }
      }
    }

    recStack.delete(nodeId);
    path.pop();
  };

  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      dfs(n.id);
    }
  });

  // Deduplicate cycles
  const uniqueCycles: string[][] = [];
  const cycleKeys = new Set<string>();
  cycles.forEach((c) => {
    const sortedKey = [...c].sort().join(",");
    if (!cycleKeys.has(sortedKey)) {
      cycleKeys.add(sortedKey);
      uniqueCycles.push(c);
    }
  });

  return uniqueCycles;
}

/**
 * Detect deep synchronous chains in request paths (paths exceeding 4 hops)
 */
export function detectDeepChains(
  nodes: GraphNode[],
  links: GraphLink[],
): string[][] {
  if (nodes.length === 0) return [];

  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  nodes.forEach((n) => {
    adj[n.id] = [];
    inDegree[n.id] = 0;
  });
  links.forEach((l) => {
    const s = getLinkId(l.source);
    const t = getLinkId(l.target);
    if (adj[s] && adj[t]) {
      adj[s].push(t);
      inDegree[t]++;
    }
  });

  const deepChains: string[][] = [];
  const currentPath: string[] = [];

  const dfs = (nodeId: string) => {
    currentPath.push(nodeId);

    const neighbors = adj[nodeId] || [];
    if (neighbors.length === 0 || currentPath.length >= 6) {
      if (currentPath.length >= 5) {
        deepChains.push([...currentPath]);
      }
    } else {
      for (const neighbor of neighbors) {
        if (!currentPath.includes(neighbor)) {
          dfs(neighbor);
        }
      }
    }
    currentPath.pop();
  };

  const entryNodes = nodes.filter(
    (n) => inDegree[n.id] === 0 || n.type === "client" || n.type === "gateway",
  );
  entryNodes.forEach((n) => {
    dfs(n.id);
  });

  // Sort chains by length descending, deduplicate subpaths
  const sorted = [...deepChains].sort((a, b) => b.length - a.length);
  const result: string[][] = [];
  sorted.forEach((chain) => {
    const key = chain.join(",");
    const isSub = result.some((r) => r.join(",").includes(key));
    if (!isSub) {
      result.push(chain);
    }
  });

  return result.slice(0, 3); // limit to top 3
}

/**
 * Detect database bottlenecks (databases queried by 3 or more services directly)
 */
export function detectDatabaseBottlenecks(
  nodes: GraphNode[],
  links: GraphLink[],
): Array<{ dbId: string; sources: string[] }> {
  const dbIncomingCount: Record<string, string[]> = {};
  nodes.forEach((n) => {
    if (n.type === "database") {
      dbIncomingCount[n.id] = [];
    }
  });

  links.forEach((l) => {
    const s = getLinkId(l.source);
    const t = getLinkId(l.target);
    if (dbIncomingCount[t]) {
      dbIncomingCount[t].push(s);
    }
  });

  return Object.entries(dbIncomingCount)
    .filter((entry) => entry[1].length >= 3)
    .map(([dbId, sources]) => ({ dbId, sources }));
}

export interface HealthScoreInfo {
  score: number;
  grade: string;
  colorClass: string;
  strokeColor: string;
  gradeDesc: string;
}

/**
 * Compute system health score based on penalty weight of active insights
 */
export function calculateHealthScore(
  systemInsights: SystemInsight[],
): HealthScoreInfo {
  let score = 100;

  systemInsights.forEach((ins) => {
    if (ins.severity === "critical") score -= 20;
    else if (ins.severity === "warning") score -= 12;
    else if (ins.severity === "optimization") score -= 5;
  });

  score = Math.max(0, Math.min(100, score));

  let grade = "A+";
  let colorClass = "text-emerald-400";
  let strokeColor = "#10b981";
  let gradeDesc = "Excellent Architecture";

  if (score >= 95) {
    grade = "A+";
    colorClass = "text-emerald-400";
    strokeColor = "#10b981";
    gradeDesc = "Excellent Architecture";
  } else if (score >= 90) {
    grade = "A";
    colorClass = "text-green-400";
    strokeColor = "#22c55e";
    gradeDesc = "Solid Design Structure";
  } else if (score >= 80) {
    grade = "B";
    colorClass = "text-indigo-400";
    strokeColor = "#6366f1";
    gradeDesc = "Good with Minor Issues";
  } else if (score >= 70) {
    grade = "C";
    colorClass = "text-amber-400";
    strokeColor = "#f59e0b";
    gradeDesc = "Moderate Coupling Risks";
  } else if (score >= 50) {
    grade = "D";
    colorClass = "text-orange-500";
    strokeColor = "#f97316";
    gradeDesc = "High Vulnerability Index";
  } else {
    grade = "F";
    colorClass = "text-red-500";
    strokeColor = "#ef4444";
    gradeDesc = "Architectural Redesign Required";
  }

  return { score, grade, colorClass, strokeColor, gradeDesc };
}
