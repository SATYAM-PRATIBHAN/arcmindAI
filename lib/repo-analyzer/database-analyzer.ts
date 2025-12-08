import { DatabaseAnalysis } from "@/types/repository-analysis";
import { GitHubTreeNode, FILE_PATTERNS } from "./constants";

export class DatabaseAnalyzer {
  private tree: GitHubTreeNode[];
  private fileContents: Map<string, string>;

  constructor(tree: GitHubTreeNode[], fileContents: Map<string, string>) {
    this.tree = tree;
    this.fileContents = fileContents;
  }

  analyze(): DatabaseAnalysis {
    const schemas: DatabaseAnalysis["schemas"] = [];
    const migrations: DatabaseAnalysis["migrations"] = [];
    let type: string | null = null;
    let orm: string | null = null;

    // Check for Prisma
    const prismaSchema = this.fileContents.get("prisma/schema.prisma");
    if (prismaSchema) {
      orm = "prisma";
      type = this.detectDatabaseType(prismaSchema);
      schemas.push({
        file: "prisma/schema.prisma",
        content: prismaSchema,
        models: this.extractPrismaModels(prismaSchema),
      });
    }

    // Check for migrations
    const migrationFolders = this.tree
      .filter((node) => FILE_PATTERNS.migrations.test(node.path))
      .filter((node) => node.type === "tree");

    for (const folder of migrationFolders) {
      const migrationFiles = this.tree.filter(
        (node) =>
          node.path.startsWith(folder.path) &&
          FILE_PATTERNS.sqlFiles.test(node.path),
      );
      migrations.push({
        folder: folder.path,
        count: migrationFiles.length,
      });
    }

    return {
      type,
      orm,
      schemas,
      migrations,
    };
  }

  private detectDatabaseType(content: string): string | null {
    if (/provider\s*=\s*"postgresql"/.test(content)) return "postgresql";
    if (/provider\s*=\s*"mysql"/.test(content)) return "mysql";
    if (/provider\s*=\s*"sqlite"/.test(content)) return "sqlite";
    if (/provider\s*=\s*"mongodb"/.test(content)) return "mongodb";
    return null;
  }

  private extractPrismaModels(content: string): string[] {
    const modelRegex = /model\s+(\w+)\s*{/g;
    const models: string[] = [];
    let match;
    while ((match = modelRegex.exec(content)) !== null) {
      models.push(match[1]);
    }
    return models;
  }
}
