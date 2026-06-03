/**
 * Represents the architectural layer of a node in the system design.
 */
export type DiagramLayer =
  | "Frontend"
  | "API"
  | "Database"
  | "Infrastructure"
  | "External"
  | "Unknown";

/**
 * Represents the criticality of a node based on its dependencies.
 */
export type NodeSeverity = "Low" | "Medium" | "High" | "Critical";

/**
 * Represents the visual shape extracted from Mermaid syntax.
 * [] = rectangle
 * {} = diamond (decision)
 * (()) = circle
 * [()] = cylinder (database)
 * ([]) = stadium
 * {{}} = hexagon
 * [/\\] = parallelogram
 */
export type NodeShape =
  | "rectangle"
  | "diamond"
  | "circle"
  | "cylinder"
  | "stadium"
  | "hexagon"
  | "parallelogram";

/**
 * A single node (entity) in the system architecture graph.
 */
export interface DiagramNode {
  /** Unique identifier for the node */
  id: string;
  /** Display label for the node */
  label: string;
  /** The type of component (e.g., 'React App', 'PostgreSQL', 'Redis') */
  type: string;
  /** The visual shape of the node */
  shape: NodeShape;
  /** Optional detailed description of the component's role */
  description?: string;
  /** The architectural layer this node belongs to */
  layer: DiagramLayer;
  /** Calculated severity based on system impact/dependencies */
  severity: NodeSeverity;
  /** ID of the subgraph this node belongs to (for grouping) */
  subgraphId?: string;
  /** Title of the subgraph (e.g., 'Infrastructure', 'Core Services') */
  subgraphTitle?: string;
  /** CSS classes applied to the node from Mermaid classDef */
  classes?: string[];
  /** Metadata for D3 force simulation (optional, managed by D3) */
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * A directional link (edge) between two nodes in the system architecture graph.
 */
export interface DiagramLink {
  /** Index added by D3 force simulation */
  index?: number;
  /** ID of the source node (or node reference after D3 initialization) */
  source: string | DiagramNode;
  /** ID of the target node (or node reference after D3 initialization) */
  target: string | DiagramNode;
  /** Optional label describing the relationship (e.g., 'gRPC', 'HTTPS') */
  label?: string;
  /** Optional metadata about the connection type */
  type?: "sync" | "async" | "fallback";
}

/**
 * The complete system graph structure required by the D3 rendering engine.
 */
export interface SystemGraph {
  nodes: DiagramNode[];
  links: DiagramLink[];
  /** Optional metadata about the overall system */
  metadata?: {
    generatedAt: string;
    version: string;
    description?: string;
    /** Diagram flow direction (Top-Down or Left-Right) */
    direction: "TD" | "LR";
  };
}
