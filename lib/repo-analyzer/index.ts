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

  // Safeguard Configurations (with sane defaults)
  private maxFilesScanned = Number(process.env.MAX_FILES_SCANNED) || 50;
  private maxTreeDepth = Number(process.env.MAX_TREE_DEPTH) || 5;
  private maxFileSizeKb = Number(process.env.MAX_FILE_SIZE_KB) || 250;

  // Trackers for skipped/truncated files
  private skippedByLimitCount = 0;
  private skippedByDepthCount = 0;
  private skippedBySizeCount = 0;

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
    // Reset trackers for every unique analysis run
    this.skippedByLimitCount = 0;
    this.skippedByDepthCount = 0;
    this.skippedBySizeCount = 0;

    // Fetch repository metadata
    const metadata = await this.fetchMetadata();

    // Fetch repository tree
    const targetBranch = this.branch || metadata.defaultBranch;
    await this.fetchTree(targetBranch);

    // 1. SAFEGUARD: Count deeply nested paths instead of destroying structural analysis data
    for (const node of this.tree) {
      const depth = node.path.split("/").length;
      if (depth > this.maxTreeDepth) {
        this.skippedByDepthCount++;
      }
    }

    // 2. SAFEGUARD: Load contents securely under strict thresholds
    await this.fetchImportantFiles();

    // Create analyzer instances (Passing full or safely restricted trees)
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

    // Run analyses in parallel
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

    // 3. User alert compilation
    let warningMessage: string | null = null;
    const totalSkipped =
      this.skippedByLimitCount +
      this.skippedByDepthCount +
      this.skippedBySizeCount;

    if (totalSkipped > 0) {
      const reasons: string[] = [];
      if (this.skippedByLimitCount > 0) {
        reasons.push(
          `${this.skippedByLimitCount} files truncated due to scanning count limit (${this.maxFilesScanned})`,
        );
      }
      if (this.skippedByDepthCount > 0) {
        reasons.push(
          `${this.skippedByDepthCount} deeply-nested paths bypassed (max level: ${this.maxTreeDepth})`,
        );
      }
      if (this.skippedBySizeCount > 0) {
        reasons.push(
          `${this.skippedBySizeCount} files skipped because their size exceeded ${this.maxFileSizeKb}KB`,
        );
      }
      warningMessage = `Repository Scanning Safeguards Active: Bypassed ${totalSkipped} elements to optimize memory and API performance (${reasons.join(", ")}).`;
    }

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
      warningMessage,
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
    this.tree = data.tree || [];
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

    let currentlyScanned = 0;
    const filesToFetch: GitHubTreeNode[] = [];

    for (const node of this.tree) {
      if (node.type !== "blob") continue;

      const isImportant = importantPatterns.some((pattern) =>
        pattern.test(node.path),
      );
      if (!isImportant) continue;

      // 1. Check file depth constraint first for specific analysis exclusion
      const depth = node.path.split("/").length;
      if (depth > this.maxTreeDepth) {
        continue; // Handled globally by skippedByDepthCount in analyze()
      }

      // 2. Size safeguarding
      const sizeKb = node.size ? Math.round(node.size / 1024) : 0;
      if (this.maxFileSizeKb > 0 && sizeKb > this.maxFileSizeKb) {
        this.skippedBySizeCount++;
        continue;
      }

      // 3. Absolute file count limitation
      if (currentlyScanned >= this.maxFilesScanned) {
        this.skippedByLimitCount++;
        continue;
      }

      filesToFetch.push(node);
      currentlyScanned++;
    }

    // Process file fetching concurrently
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
      // Sane logging that won't break if error.response.data is rendered as plain text
      console.error(
        `Failed to fetch file context at path: ${path}. Message:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}
