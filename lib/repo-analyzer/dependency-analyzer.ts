import {
  DependencyAnalysis,
  DependencyInfo,
} from "@/types/repository-analysis";

export class DependencyAnalyzer {
  private fileContents: Map<string, string>;

  constructor(fileContents: Map<string, string>) {
    this.fileContents = fileContents;
  }

  analyze(): DependencyAnalysis {
    const dependencies: DependencyInfo[] = [];
    let packageManager: string | null = null;
    const frameworks: string[] = [];
    const databases: string[] = [];
    const testing: string[] = [];
    const buildTools: string[] = [];

    // Parse package.json
    const packageJson = this.fileContents.get("package.json");
    if (packageJson) {
      packageManager = "npm";
      try {
        const pkg = JSON.parse(packageJson);
        const allDeps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
        };

        for (const [name, version] of Object.entries(allDeps)) {
          const type = pkg.dependencies?.[name] ? "runtime" : "dev";
          dependencies.push({
            name,
            version: version as string,
            type,
            category: this.categorizeDependency(name),
          });

          // Categorize
          if (this.isFramework(name)) frameworks.push(name);
          if (this.isDatabase(name)) databases.push(name);
          if (this.isTestingTool(name)) testing.push(name);
        }
      } catch (error) {
        console.error("Failed to parse package.json:", error);
      }
    }

    // Parse requirements.txt
    const requirementsTxt = this.fileContents.get("requirements.txt");
    if (requirementsTxt) {
      packageManager = "pip";
      const lines = requirementsTxt.split("\n");
      for (const line of lines) {
        const match = line.match(/^([a-zA-Z0-9-_]+)(==|>=|<=)?(.*)$/);
        if (match) {
          const [, name, , version] = match;
          dependencies.push({
            name,
            version: version || "latest",
            type: "runtime",
          });
        }
      }
    }

    return {
      packageManager,
      dependencies,
      frameworks,
      databases,
      testing,
      buildTools,
    };
  }

  private categorizeDependency(name: string): string {
    if (this.isFramework(name)) return "web-framework";
    if (this.isDatabase(name)) return "database";
    if (this.isTestingTool(name)) return "testing";
    if (/(react|vue|angular|svelte)/.test(name)) return "ui";
    return "utility";
  }

  private isFramework(name: string): boolean {
    return /(next|express|fastify|nest|django|flask|gin|fiber|spring)/.test(
      name,
    );
  }

  private isDatabase(name: string): boolean {
    return /(prisma|typeorm|sequelize|mongoose|pg|mysql|redis|mongodb)/.test(
      name,
    );
  }

  private isTestingTool(name: string): boolean {
    return /(jest|vitest|mocha|chai|pytest|junit|testing-library)/.test(name);
  }
}
