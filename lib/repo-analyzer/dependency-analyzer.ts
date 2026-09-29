import {
  DependencyAnalysis,
  DependencyInfo,
} from "@/types/repository-analysis";
import { FILE_PATTERNS, getFileContentByPattern } from "./constants";

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
    const packageJson = getFileContentByPattern(
      this.fileContents,
      FILE_PATTERNS.packageJson,
    );
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
    const requirementsTxt = getFileContentByPattern(
      this.fileContents,
      FILE_PATTERNS.requirementsTxt,
    );
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

    // Parse go.mod
    const goMod = getFileContentByPattern(
      this.fileContents,
      FILE_PATTERNS.goMod,
    );
    if (goMod) {
      packageManager = "go";
      const lines = goMod.split("\n");
      let inRequire = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("require (")) {
          inRequire = true;
          continue;
        }
        if (inRequire && trimmed.startsWith(")")) {
          inRequire = false;
          continue;
        }
        if (inRequire && trimmed) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2) {
            const [name, version] = parts;
            const cleanName = name.replace(/;?$/, "");
            const isIndirect = trimmed.includes("// indirect");
            dependencies.push({
              name: cleanName,
              version,
              type: isIndirect ? "peer" : "runtime",
              category: this.categorizeDependency(cleanName),
            });
            if (this.isFramework(cleanName)) frameworks.push(cleanName);
            if (this.isDatabase(cleanName)) databases.push(cleanName);
            if (this.isTestingTool(cleanName)) testing.push(cleanName);
          }
        } else if (trimmed.startsWith("require ")) {
          const parts = trimmed.substring(8).trim().split(/\s+/);
          if (parts.length >= 2) {
            const [name, version] = parts;
            const cleanName = name.replace(/;?$/, "");
            const isIndirect = trimmed.includes("// indirect");
            dependencies.push({
              name: cleanName,
              version,
              type: isIndirect ? "peer" : "runtime",
              category: this.categorizeDependency(cleanName),
            });
            if (this.isFramework(cleanName)) frameworks.push(cleanName);
            if (this.isDatabase(cleanName)) databases.push(cleanName);
            if (this.isTestingTool(cleanName)) testing.push(cleanName);
          }
        }
      }
    }

    // Parse Cargo.toml
    const cargoToml = getFileContentByPattern(
      this.fileContents,
      FILE_PATTERNS.cargoToml,
    );
    if (cargoToml) {
      packageManager = "cargo";
      const lines = cargoToml.split("\n");
      let inDependencies = false;
      let inDevDependencies = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("[dependencies]")) {
          inDependencies = true;
          inDevDependencies = false;
          continue;
        }
        if (trimmed.startsWith("[dev-dependencies]")) {
          inDependencies = false;
          inDevDependencies = true;
          continue;
        }
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          inDependencies = false;
          inDevDependencies = false;
          continue;
        }
        if (
          (inDependencies || inDevDependencies) &&
          trimmed &&
          !trimmed.startsWith("#")
        ) {
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const name = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim();
            let version = "latest";
            if (val.startsWith('"')) {
              version = val.replace(/^"|"$/g, "");
            } else if (val.startsWith("{")) {
              const versionMatch = val.match(/version\s*=\s*"([^"]+)"/);
              if (versionMatch) {
                version = versionMatch[1];
              }
            }
            const type = inDevDependencies ? "dev" : "runtime";
            dependencies.push({
              name,
              version,
              type,
              category: this.categorizeDependency(name),
            });
            if (this.isFramework(name)) frameworks.push(name);
            if (this.isDatabase(name)) databases.push(name);
            if (this.isTestingTool(name)) testing.push(name);
          }
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
    return /(next|express|fastify|nest|django|flask|gin|fiber|spring|echo|beego|chi|actix-web|axum|rocket|warp)/.test(
      name,
    );
  }

  private isDatabase(name: string): boolean {
    return /(prisma|typeorm|sequelize|mongoose|pg|mysql|redis|mongodb|gorm|sqlx|pgx|diesel|tokio-postgres|rusqlite|redis-rs)/.test(
      name,
    );
  }

  private isTestingTool(name: string): boolean {
    return /(jest|vitest|mocha|chai|pytest|junit|testing-library|testify|cargo-test|pretty_assertions)/.test(
      name,
    );
  }
}
