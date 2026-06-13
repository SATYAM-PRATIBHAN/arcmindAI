import { getCacheKey, withCache } from "@/lib/cache";
import { RepoMetadata, RepositoryAnalysis } from "@/types/repository-analysis";
import axios from "axios";
import { APIAnalyzer } from "./api-analyzer";
import { ArchitectureAnalyzer } from "./architecture-analyzer";
import { FILE_PATTERNS, GitHubTreeNode } from "./constants";
import { DatabaseAnalyzer } from "./database-analyzer";
import { DependencyAnalyzer } from "./dependency-analyzer";
import { EnvironmentAnalyzer } from "./environment-analyzer";
import { InfrastructureAnalyzer } from "./infrastructure-analyzer";
import { MessagingAnalyzer } from "./messaging-analyzer";
import { TestAnalyzer } from "./test-analyzer";

const CACHE_TTL_SECONDS = 60 * 60;

export class RepositoryAnalyzer {
  private userId: string;
  private owner: string;
  private repo: string;
  private branch?: string;
  private token: string;
  private tree: GitHubTreeNode[] = [];
  private fileContents: Map<string, string> = new Map();
  private warnings: string[] = [];

  constructor(
    userId: string,
    owner: string,
    repo: string,
    token: string,
    branch?: string,
  ) {
    this.userId = userId;
    this.owner = owner;
    this.repo = repo;
    this.token = token;
    this.branch = branch;
  }

  async analyze(): Promise<RepositoryAnalysis> {
    // Fetch repository metadata
    const metadata = await this.fetchMetadata();

    // Fetch repository tree on the selected branch (fallback to default)
    const targetBranch = this.branch || metadata.defaultBranch;
    await this.fetchTree(targetBranch);

    // Fetch important file contents
    await this.fetchImportantFiles();

    // Create analyzer instances
    const architectureAnalyzer = new ArchitectureAnalyzer(this.tree);
    const dependencyAnalyzer = new DependencyAnalyzer(this.fileContents);
    const databaseAnalyzer = new DatabaseAnalyzer(this.tree, this.fileContents);
    const apiAnalyzer = new APIAnalyzer(this.tree);
    const infrastructureAnalyzer = new InfrastructureAnalyzer(this.tree);
    const environmentAnalyzer = new EnvironmentAnalyzer(
      this.tree,
      this.fileContents,
    );
    const testAnalyzer = new TestAnalyzer(this.tree, this.fileContents);
    const messagingAnalyzer = new MessagingAnalyzer(
      this.tree,
      this.fileContents,
    );

    // Run all analyses in parallel
    const [
      architecture,
      dependencies,
      database,
      apis,
      infrastructure,
      environment,
      tests,
      messaging,
    ] = await Promise.all([
      Promise.resolve(architectureAnalyzer.analyze()),
      Promise.resolve(dependencyAnalyzer.analyze()),
      Promise.resolve(databaseAnalyzer.analyze()),
      Promise.resolve(apiAnalyzer.analyze()),
      Promise.resolve(infrastructureAnalyzer.analyze()),
      Promise.resolve(environmentAnalyzer.analyze()),
      Promise.resolve(testAnalyzer.analyze()),
      Promise.resolve(messagingAnalyzer.analyze()),
    ]);

    return {
      metadata,
      architecture,
      dependencies,
      database,
      apis,
      infrastructure,
      environment,
      tests,
      messaging,
      analyzedAt: new Date().toISOString(),
      warnings: this.warnings,
    };
  }

  private async fetchMetadata(): Promise<RepoMetadata> {
    const [repo, languages] = await Promise.all([
      withCache(
        getCacheKey("github:repo-info", this.userId, this.owner, this.repo),
        CACHE_TTL_SECONDS,
        async () => {
          const response = await axios.get(
            `https://api.github.com/repos/${this.owner}/${this.repo}`,
            { headers: { Authorization: `Bearer ${this.token}` } },
          );
          return response.data;
        },
      ),
      withCache(
        getCacheKey(
          "github:repo-languages",
          this.userId,
          this.owner,
          this.repo,
        ),
        CACHE_TTL_SECONDS,
        async () => {
          const response = await axios.get(
            `https://api.github.com/repos/${this.owner}/${this.repo}/languages`,
            { headers: { Authorization: `Bearer ${this.token}` } },
          );
          return response.data || {};
        },
      ),
    ]);

    return {
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      languages,
      topics: repo.topics || [],
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      defaultBranch: repo.default_branch,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      size: repo.size,
      isPrivate: repo.private,
      license: repo.license?.name || null,
    };
  }

  private async fetchTree(branch: string): Promise<void> {
    const data = await withCache(
      getCacheKey(
        "github:repo-tree",
        this.userId,
        this.owner,
        this.repo,
        branch,
      ),
      CACHE_TTL_SECONDS,
      async () => {
        const response = await axios.get(
          `https://api.github.com/repos/${this.owner}/${this.repo}/git/trees/${branch}?recursive=1`,
          { headers: { Authorization: `Bearer ${this.token}` } },
        );
        return response.data;
      },
    );

    if (data.truncated) {
      this.warnings.push(
        "The repository tree is too large. Some files may have been skipped by GitHub.",
      );
    }

    const MAX_REPO_TREE_SIZE = Number(process.env.MAX_REPO_TREE_SIZE) || 20000;
    if (data.tree.length > MAX_REPO_TREE_SIZE) {
      throw new Error(
        `Repository exceeds maximum allowed size for analysis (${MAX_REPO_TREE_SIZE} files).`,
      );
    }

    const MAX_REPO_DEPTH = Number(process.env.MAX_REPO_DEPTH) || 10;
    const originalLength = data.tree.length;
    this.tree = data.tree.filter(
      (node: GitHubTreeNode) => node.path.split("/").length <= MAX_REPO_DEPTH,
    );

    const removedByDepth = originalLength - this.tree.length;
    if (removedByDepth > 0) {
      this.warnings.push(
        `Skipped ${removedByDepth} files exceeding max depth of ${MAX_REPO_DEPTH}.`,
      );
    }
  }

  private async fetchImportantFiles(): Promise<void> {
    const importantPatterns = [
      FILE_PATTERNS.packageJson,
      FILE_PATTERNS.requirementsTxt,
      FILE_PATTERNS.goMod,
      FILE_PATTERNS.cargoToml,
      FILE_PATTERNS.prismaSchema,
      FILE_PATTERNS.envExample,
      FILE_PATTERNS.dockerfile,
      FILE_PATTERNS.dockerCompose,
      FILE_PATTERNS.openapi,
    ];

    const MAX_REPO_FILES_SCANNED =
      Number(process.env.MAX_REPO_FILES_SCANNED) || 50;

    let filesToFetch = this.tree
      .filter((node) => node.type === "blob")
      .filter((node) =>
        importantPatterns.some((pattern) => pattern.test(node.path)),
      );

    if (filesToFetch.length > MAX_REPO_FILES_SCANNED) {
      this.warnings.push(
        `Truncated file scans: analyzed ${MAX_REPO_FILES_SCANNED} out of ${filesToFetch.length} important files.`,
      );
      filesToFetch = filesToFetch.slice(0, MAX_REPO_FILES_SCANNED);
    }

    await Promise.all(
      filesToFetch.map((file) => this.fetchFileContent(file.path)),
    );
  }

  private async fetchFileContent(path: string): Promise<void> {
    try {
      const ref = this.branch;
      const data = await withCache<string>(
        getCacheKey(
          "github:file-content",
          this.userId,
          this.owner,
          this.repo,
          ref || "",
          path,
        ),
        CACHE_TTL_SECONDS,
        async () => {
          const response = await axios.get(
            `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`,
            {
              headers: {
                Authorization: `Bearer ${this.token}`,
                Accept: "application/vnd.github.raw",
              },
              params: ref ? { ref } : undefined,
              responseType: "text",
            },
          );
          return response.data;
        },
      );
      this.fileContents.set(path, data);
    } catch (error) {
      console.error(`Failed to fetch ${path}:`, error);
    }
  }
}
