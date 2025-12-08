import { EnvironmentAnalysis } from "@/types/repository-analysis";
import { GitHubTreeNode, FILE_PATTERNS } from "./constants";

export class EnvironmentAnalyzer {
  private tree: GitHubTreeNode[];
  private fileContents: Map<string, string>;

  constructor(tree: GitHubTreeNode[], fileContents: Map<string, string>) {
    this.tree = tree;
    this.fileContents = fileContents;
  }

  analyze(): EnvironmentAnalysis {
    const files = this.tree
      .filter(
        (node) =>
          FILE_PATTERNS.envExample.test(node.path) ||
          FILE_PATTERNS.envFile.test(node.path),
      )
      .map((n) => n.path);

    const variables: EnvironmentAnalysis["variables"] = [];
    const services: string[] = [];
    const integrations: string[] = [];

    // Parse .env.example if available
    for (const file of files) {
      const content = this.fileContents.get(file);
      if (content) {
        const lines = content.split("\n");
        for (const line of lines) {
          const match = line.match(/^([A-Z_]+)=/);
          if (match) {
            variables.push({
              name: match[1],
              required: true,
            });

            // Detect services from variable names
            if (/DATABASE|POSTGRES|MYSQL|MONGO/.test(match[1]))
              services.push("database");
            if (/REDIS/.test(match[1])) services.push("redis");
            if (/STRIPE/.test(match[1])) integrations.push("stripe");
            if (/SENDGRID|MAILGUN/.test(match[1])) integrations.push("email");
          }
        }
      }
    }

    return {
      files,
      variables,
      services: [...new Set(services)],
      integrations: [...new Set(integrations)],
    };
  }
}
