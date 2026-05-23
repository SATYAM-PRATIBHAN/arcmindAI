// app/(protected)/generate/utils/parser.ts

export interface GraphNode {
  id: string;
  label: string;
  shape: "database" | "decision" | "circle" | "stadium" | "rect";
  type:
    | "client"
    | "gateway"
    | "service"
    | "database"
    | "decision"
    | "component";
  parentId?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
  targetX?: number;
  targetY?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
}

export interface GraphSubgraph {
  id: string;
  label: string;
}

export interface ParsedGraph {
  nodes: GraphNode[];
  links: GraphLink[];
  subgraphs: GraphSubgraph[];
}

/**
 * Determine node type based on shape and label content for semantic styling
 */
function determineNodeType(
  id: string,
  label: string,
  shape: string,
  parentSubgraphId?: string,
): GraphNode["type"] {
  const lowercaseLabel = label.toLowerCase();
  const lowercaseId = id.toLowerCase();

  if (
    shape === "database" ||
    lowercaseLabel.includes("database") ||
    lowercaseLabel.includes(" db") ||
    lowercaseLabel.includes("db ") ||
    lowercaseLabel === "db" ||
    lowercaseLabel.includes("postgres") ||
    lowercaseLabel.includes("mongodb") ||
    lowercaseLabel.includes("redis") ||
    lowercaseLabel.includes("mysql") ||
    lowercaseLabel.includes("prisma") ||
    lowercaseLabel.includes("datastore")
  ) {
    return "database";
  }

  if (shape === "decision") {
    return "decision";
  }

  if (
    lowercaseLabel.includes("client") ||
    lowercaseLabel.includes("browser") ||
    lowercaseLabel.includes("frontend") ||
    lowercaseLabel.includes("app ") ||
    lowercaseLabel.includes(" ui") ||
    lowercaseLabel.includes("mobile") ||
    lowercaseLabel.includes("user interface")
  ) {
    return "client";
  }

  if (
    lowercaseLabel.includes("gateway") ||
    lowercaseLabel.includes("load balancer") ||
    lowercaseLabel.includes("nginx") ||
    lowercaseLabel.includes("ingress") ||
    lowercaseLabel.includes("router")
  ) {
    return "gateway";
  }

  if (
    lowercaseLabel.includes("service") ||
    lowercaseLabel.includes("api") ||
    lowercaseLabel.includes("worker") ||
    lowercaseLabel.includes("controller") ||
    lowercaseLabel.includes("backend") ||
    (parentSubgraphId && parentSubgraphId.toLowerCase().includes("service"))
  ) {
    return "service";
  }

  return "component";
}

export function parseMermaidFlowchart(chart: string): ParsedGraph {
  const nodesMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const subgraphsMap = new Map<string, GraphSubgraph>();
  const subgraphStack: string[] = [];

  if (!chart || typeof chart !== "string") {
    return { nodes: [], links: [], subgraphs: [] };
  }

  const lines = chart.split("\n");

  // Regex patterns to identify node shapes (ordered from most specific to least specific)
  // Database: ID[("Label")] or ID[(Label)]
  const dbPattern =
    /([A-Za-z0-9_-]+)\[\("([^"]+)"\)\]|([A-Za-z0-9_-]+)\[\(([^)]+)\)\]/;
  // Decision: ID{"Label"} or ID{Label}
  const decisionPattern =
    /([A-Za-z0-9_-]+)\{"([^"]+)"\}|([A-Za-z0-9_-]+)\{([^}]+)\}/;
  // Circle: ID(("Label")) or ID((Label))
  const circlePattern =
    /([A-Za-z0-9_-]+)\(\("([^"]+)"\)\)|([A-Za-z0-9_-]+)\(\(([^)]+)\)\)/;
  // Stadium: ID(["Label"]) or ID([Label])
  const stadiumPattern =
    /([A-Za-z0-9_-]+)\(\["([^"]+)"\]\)|([A-Za-z0-9_-]+)\(\[([^\]]+)\]\)/;
  // Rect: ID["Label"] or ID[Label]
  const rectPattern =
    /([A-Za-z0-9_-]+)\["([^"]+)"\]|([A-Za-z0-9_-]+)\[([^\]]+)\]/;

  for (let line of lines) {
    line = line.trim();

    // Skip flowchart header, comments, styles, or configuration lines
    if (
      !line ||
      line.startsWith("%%") ||
      line.toLowerCase().startsWith("flowchart") ||
      line.toLowerCase().startsWith("graph") ||
      line.toLowerCase().startsWith("style") ||
      line.toLowerCase().startsWith("classdef") ||
      line.toLowerCase().startsWith("class") ||
      line.toLowerCase().startsWith("click")
    ) {
      continue;
    }

    // 1. Detect Subgraph start
    // e.g. subgraph Services["Core Services"] or subgraph Services or subgraph Services ["Core Services"]
    if (line.toLowerCase().startsWith("subgraph")) {
      const subgraphMatch = line.match(
        /^subgraph\s+([A-Za-z0-9_-]+)(?:\s*\["([^"]+)"\]|\s*\[([^\]]+)\]|\s+"([^"]+)")?/i,
      );
      if (subgraphMatch) {
        const id = subgraphMatch[1];
        const label =
          subgraphMatch[2] || subgraphMatch[3] || subgraphMatch[4] || id;
        subgraphsMap.set(id, { id, label });
        subgraphStack.push(id);
      }
      continue;
    }

    // 2. Detect Subgraph end
    if (line.toLowerCase() === "end") {
      subgraphStack.pop();
      continue;
    }

    // 3. Extract Node Declarations from the line and replace them with their raw ID.
    // This allows us to parse connections cleanly.
    let lineForLinks = line;
    let nodeFound = true;

    while (nodeFound) {
      nodeFound = false;

      // Check shapes
      const dbMatch = lineForLinks.match(dbPattern);
      if (dbMatch) {
        const id = dbMatch[1] || dbMatch[3];
        const label = dbMatch[2] || dbMatch[4];
        const parentId = subgraphStack[subgraphStack.length - 1];
        const type = determineNodeType(id, label, "database", parentId);
        nodesMap.set(id, { id, label, shape: "database", type, parentId });
        lineForLinks = lineForLinks.replace(dbMatch[0], id);
        nodeFound = true;
        continue;
      }

      const decisionMatch = lineForLinks.match(decisionPattern);
      if (decisionMatch) {
        const id = decisionMatch[1] || decisionMatch[3];
        const label = decisionMatch[2] || decisionMatch[4];
        const parentId = subgraphStack[subgraphStack.length - 1];
        const type = determineNodeType(id, label, "decision", parentId);
        nodesMap.set(id, { id, label, shape: "decision", type, parentId });
        lineForLinks = lineForLinks.replace(decisionMatch[0], id);
        nodeFound = true;
        continue;
      }

      const circleMatch = lineForLinks.match(circlePattern);
      if (circleMatch) {
        const id = circleMatch[1] || circleMatch[3];
        const label = circleMatch[2] || circleMatch[4];
        const parentId = subgraphStack[subgraphStack.length - 1];
        const type = determineNodeType(id, label, "circle", parentId);
        nodesMap.set(id, { id, label, shape: "circle", type, parentId });
        lineForLinks = lineForLinks.replace(circleMatch[0], id);
        nodeFound = true;
        continue;
      }

      const stadiumMatch = lineForLinks.match(stadiumPattern);
      if (stadiumMatch) {
        const id = stadiumMatch[1] || stadiumMatch[3];
        const label = stadiumMatch[2] || stadiumMatch[4];
        const parentId = subgraphStack[subgraphStack.length - 1];
        const type = determineNodeType(id, label, "stadium", parentId);
        nodesMap.set(id, { id, label, shape: "stadium", type, parentId });
        lineForLinks = lineForLinks.replace(stadiumMatch[0], id);
        nodeFound = true;
        continue;
      }

      const rectMatch = lineForLinks.match(rectPattern);
      if (rectMatch) {
        const id = rectMatch[1] || rectMatch[3];
        const label = rectMatch[2] || rectMatch[4];
        const parentId = subgraphStack[subgraphStack.length - 1];
        const type = determineNodeType(id, label, "rect", parentId);
        nodesMap.set(id, { id, label, shape: "rect", type, parentId });
        lineForLinks = lineForLinks.replace(rectMatch[0], id);
        nodeFound = true;
        continue;
      }
    }

    // 4. Parse Connections
    // Now lineForLinks is sanitized, e.g. "A --> B" or "A -->|HTTP| B" or "A -- HTTP --> B"
    // Match Link type: A -->|"label"| B or A -->|label| B
    const linkWithLabelMatch = lineForLinks.match(
      /([A-Za-z0-9_-]+)\s*-->\s*\|"?([^"|]+)"?\|\s*([A-Za-z0-9_-]+)/,
    );
    if (linkWithLabelMatch) {
      const source = linkWithLabelMatch[1];
      const label = linkWithLabelMatch[2];
      const target = linkWithLabelMatch[3];
      links.push({ source, target, label });
      ensureNodeExists(source);
      ensureNodeExists(target);
      continue;
    }

    // Match Link type: A -- "label" --> B or A -- label --> B
    const linkWithLabelMatch2 = lineForLinks.match(
      /([A-Za-z0-9_-]+)\s*--\s*"?([^"->]+)"?\s*-->\s*([A-Za-z0-9_-]+)/,
    );
    if (linkWithLabelMatch2) {
      const source = linkWithLabelMatch2[1];
      const label = linkWithLabelMatch2[2].trim();
      const target = linkWithLabelMatch2[3];
      links.push({ source, target, label });
      ensureNodeExists(source);
      ensureNodeExists(target);
      continue;
    }

    // Match Link type: A --> B
    const linkMatch = lineForLinks.match(
      /([A-Za-z0-9_-]+)\s*-->\s*([A-Za-z0-9_-]+)/,
    );
    if (linkMatch) {
      const source = linkMatch[1];
      const target = linkMatch[2];
      links.push({ source, target });
      ensureNodeExists(source);
      ensureNodeExists(target);
      continue;
    }

    // If it's just a single node ID on a line, e.g. "A" (used to declare a node with default label inside subgraph)
    const singleNodeMatch = lineForLinks.match(/^([A-Za-z0-9_-]+)$/);
    if (singleNodeMatch) {
      const id = singleNodeMatch[1];
      ensureNodeExists(id);
    }
  }

  // Helper to register node with default options if it was only referenced in edges
  function ensureNodeExists(id: string) {
    if (!nodesMap.has(id)) {
      const parentId = subgraphStack[subgraphStack.length - 1];
      const type = determineNodeType(id, id, "rect", parentId);
      nodesMap.set(id, {
        id,
        label: id,
        shape: "rect",
        type,
        parentId,
      });
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links,
    subgraphs: Array.from(subgraphsMap.values()),
  };
}
