import {
  DiagramNode,
  DiagramWalkthroughStep,
  NodeRelation,
  SystemGraph,
} from "@/types/diagram";

/**
 * Analyze the SystemGraph diagram structure to extract nodes' relations.
 */
export function analyzeDiagramRelations(
  systemGraph: SystemGraph,
): Record<string, NodeRelation> {
  const res: Record<string, NodeRelation> = {};
  const nodes = systemGraph.nodes;
  const edges = systemGraph.links;
  const nodeId2Node: Record<string, DiagramNode> = {};
  const graph: Record<string, NodeRelation> = {};
  for (const node of nodes) {
    graph[node.id] = {
      ancestors: [],
      descendants: [],
    };
    nodeId2Node[node.id] = node;
  }
  for (const edge of edges) {
    const srcId =
      typeof edge.source === "string" ? edge.source : edge.source.id;
    const tgtId =
      typeof edge.target === "string" ? edge.target : edge.target.id;
    graph[srcId].descendants.push(nodeId2Node[tgtId]);
    graph[tgtId].ancestors.push(nodeId2Node[srcId]);
  }

  for (const node of nodes) {
    res[node.id] = {
      ancestors: dfs(node.id, graph, new Set<string>(), "ancestors"),
      descendants: dfs(node.id, graph, new Set<string>(), "descendants"),
    };
  }
  return res;
}

/**
 * Builds the ordered steps for the guided walkthrough. Nodes are ordered by
 * their number of direct upstream connections.
 */
export function buildDiagramWalkthroughSteps(
  systemGraph: SystemGraph,
): DiagramWalkthroughStep[] {
  const nodeId2Label: Record<string, string> = {};

  for (const node of systemGraph.nodes) nodeId2Label[node.id] = node.label;

  const directUpstreams: Record<string, string[]> = {};
  for (const link of systemGraph.links) {
    const srcId =
      typeof link.source === "string" ? link.source : link.source.id;
    const tgtId =
      typeof link.target === "string" ? link.target : link.target.id;
    const sourceLabel = nodeId2Label[srcId];
    if (!sourceLabel) continue;

    // Describes a single inbound connection, e.g. "API via HTTPS (sync)".
    let text = sourceLabel;
    if (link.label) text += ` via ${link.label}`;
    if (link.type) text += ` (${link.type})`;
    (directUpstreams[tgtId] ??= []).push(text);
  }

  return [...systemGraph.nodes]
    .sort((a, b) => {
      const upstreamsA = directUpstreams[a.id]?.length ?? 0;
      const upstreamsB = directUpstreams[b.id]?.length ?? 0;
      if (upstreamsA !== upstreamsB) return upstreamsA - upstreamsB;
      return b.centralityScore - a.centralityScore;
    })
    .map((node, index) => ({
      index,
      nodeId: node.id,
      caption: buildCaption(node, directUpstreams[node.id] ?? []),
    }));
}

/** Composes the narration shown for a step from the node's own fields. */
function buildCaption(node: DiagramNode, upstreams: string[]): string {
  const lead =
    upstreams.length === 0
      ? `Entry point — ${node.label}`
      : `${node.label} — receives from ${upstreams.join(", ")}`;

  let caption = `${lead}. ${node.type}, ${node.layer} layer.`;
  if (node.description) caption += ` ${node.description}`;
  return caption;
}

function dfs(
  id: string,
  graph: Record<string, NodeRelation>,
  visited: Set<string>,
  dir: keyof NodeRelation,
): DiagramNode[] {
  const nodes: DiagramNode[] = [];
  for (const node of graph[id][dir]) {
    if (!visited.has(node.id)) {
      visited.add(node.id);
      nodes.push(node);
      nodes.push(...dfs(node.id, graph, visited, dir));
    }
  }
  return nodes;
}
