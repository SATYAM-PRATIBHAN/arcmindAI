import { TestAnalysis } from "@/types/repository-analysis";
import { GitHubTreeNode, FILE_PATTERNS } from "./constants";

export class TestAnalyzer {
  private tree: GitHubTreeNode[];
  private fileContents: Map<string, string>;

  constructor(tree: GitHubTreeNode[], fileContents: Map<string, string>) {
    this.tree = tree;
    this.fileContents = fileContents;
  }

  analyze(): TestAnalysis {
    const testFiles = this.tree
      .filter((node) => FILE_PATTERNS.testFiles.test(node.path))
      .map((node) => ({
        path: node.path,
        type: this.categorizeTestType(node.path),
      }));

    let framework: string | null = null;
    const packageJson = this.fileContents.get("package.json");
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps.jest) framework = "jest";
        else if (allDeps.vitest) framework = "vitest";
        else if (allDeps.mocha) framework = "mocha";
      } catch (error) {
        console.error("Failed to parse package.json", error);
      }
    }

    return {
      framework,
      testFiles,
      coverage: {
        hasConfig: this.tree.some((n) =>
          /jest\.config|vitest\.config/.test(n.path),
        ),
      },
      totalTests: testFiles.length,
    };
  }

  private categorizeTestType(path: string): string {
    if (/e2e|integration/.test(path)) return "e2e";
    if (/integration/.test(path)) return "integration";
    if (/unit/.test(path)) return "unit";
    return "unknown";
  }
}
