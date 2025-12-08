import { ArchitectureAnalysis } from "@/types/repository-analysis";
import { GitHubTreeNode } from "./constants";

export class ArchitectureAnalyzer {
  private tree: GitHubTreeNode[];

  constructor(tree: GitHubTreeNode[]) {
    this.tree = tree;
  }

  analyze(): ArchitectureAnalysis {
    const folders = this.tree
      .filter((node) => node.type === "tree")
      .map((node) => node.path);

    // Detect architecture patterns
    const hasServices = folders.some((f) => /^(services?|apps?)\//i.test(f));
    const hasModules = folders.some((f) => /^modules?\//i.test(f));
    const hasLayers = folders.some((f) =>
      /(controllers?|models?|views?|services?)\//i.test(f),
    );
    const hasDomains = folders.some((f) => /^(domain|domains)\//i.test(f));

    let pattern = "unknown";
    if (hasServices) pattern = "microservices";
    else if (hasDomains) pattern = "domain-driven";
    else if (hasLayers) pattern = "layered";
    else if (hasModules) pattern = "modular";
    else pattern = "monolith";

    // Analyze folder purposes
    const folderAnalysis = folders.slice(0, 20).map((path) => ({
      path,
      purpose: this.categorizeFolderPurpose(path),
    }));

    // Detect naming conventions
    const namingStyle = this.detectNamingStyle(folders);
    const organizationBy = hasServices
      ? "service"
      : hasDomains
        ? "domain"
        : hasLayers
          ? "layer"
          : "feature";

    return {
      pattern,
      structure: {
        hasServices,
        hasModules,
        hasLayers,
        hasDomains,
      },
      folders: folderAnalysis,
      conventions: {
        namingStyle,
        organizationBy,
      },
    };
  }

  private categorizeFolderPurpose(path: string): string {
    if (/^(services?|apps?)\//i.test(path)) return "service";
    if (/^modules?\//i.test(path)) return "module";
    if (/(controllers?|models?|views?)\//i.test(path)) return "layer";
    if (/^(domain|domains)\//i.test(path)) return "domain";
    if (/(utils?|helpers?|lib)\//i.test(path)) return "utility";
    return "unknown";
  }

  private detectNamingStyle(paths: string[]): string {
    const kebabCount = paths.filter((p) => /-/.test(p)).length;
    const snakeCount = paths.filter((p) => /_/.test(p)).length;
    const camelCount = paths.filter((p) => /[a-z][A-Z]/.test(p)).length;

    if (kebabCount > snakeCount && kebabCount > camelCount) return "kebab-case";
    if (snakeCount > kebabCount && snakeCount > camelCount) return "snake_case";
    if (camelCount > 0) return "camelCase";
    return "mixed";
  }
}
