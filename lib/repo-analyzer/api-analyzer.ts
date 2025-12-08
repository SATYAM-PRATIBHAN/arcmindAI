import { APIAnalysis } from "@/types/repository-analysis";
import { GitHubTreeNode, FILE_PATTERNS } from "./constants";

export class APIAnalyzer {
  private tree: GitHubTreeNode[];

  constructor(tree: GitHubTreeNode[]) {
    this.tree = tree;
  }

  analyze(): APIAnalysis {
    const type: string[] = [];
    const endpoints: APIAnalysis["endpoints"] = [];
    const schemas: APIAnalysis["schemas"] = [];
    const routeFiles: string[] = [];

    // Detect API types
    const hasGraphQL = this.tree.some((node) =>
      FILE_PATTERNS.graphql.test(node.path),
    );
    const hasGRPC = this.tree.some((node) =>
      FILE_PATTERNS.proto.test(node.path),
    );
    const hasREST = this.tree.some((node) =>
      FILE_PATTERNS.routes.test(node.path),
    );

    if (hasGraphQL) type.push("GraphQL");
    if (hasGRPC) type.push("gRPC");
    if (hasREST) type.push("REST");

    // Find route files
    const apiFiles = this.tree.filter(
      (node) =>
        node.type === "blob" &&
        (FILE_PATTERNS.routes.test(node.path) ||
          FILE_PATTERNS.graphql.test(node.path) ||
          FILE_PATTERNS.proto.test(node.path)),
    );

    routeFiles.push(...apiFiles.map((f) => f.path));

    // Find OpenAPI/Swagger schemas
    const openapiFiles = this.tree.filter((node) =>
      FILE_PATTERNS.openapi.test(node.path),
    );
    for (const file of openapiFiles) {
      schemas.push({
        file: file.path,
        type: "openapi",
      });
    }

    return {
      type,
      endpoints,
      schemas,
      routeFiles,
    };
  }
}
