import { RepositoryAnalysis, RepoMetadata } from "@/types/repository-analysis";
import axios from "axios";
import { GitHubTreeNode, FILE_PATTERNS } from "./constants";
import { ArchitectureAnalyzer } from "./architecture-analyzer";
import { DependencyAnalyzer } from "./dependency-analyzer";
import { DatabaseAnalyzer } from "./database-analyzer";
import { APIAnalyzer } from "./api-analyzer";
import { InfrastructureAnalyzer } from "./infrastructure-analyzer";
import { EnvironmentAnalyzer } from "./environment-analyzer";
import { TestAnalyzer } from "./test-analyzer";
import { MessagingAnalyzer } from "./messaging-analyzer";

export class RepositoryAnalyzer {
  private owner: string;
  private repo: string;
  private token: string;
  private tree: GitHubTreeNode[] = [];
  private fileContents: Map<string, string> = new Map();

  constructor(owner: string, repo: string, token: string) {
    this.owner = owner;
    this.repo = repo;
    this.token = token;
  }

  async analyze(): Promise<RepositoryAnalysis> {
    // Fetch repository metadata
    const metadata = await this.fetchMetadata();

    // Fetch repository tree
    await this.fetchTree(metadata.defaultBranch);

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
    };
  }

  private async fetchMetadata(): Promise<RepoMetadata> {
    const [repoRes, languagesRes] = await Promise.all([
      axios.get(`https://api.github.com/repos/${this.owner}/${this.repo}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      }),
      axios.get(
        `https://api.github.com/repos/${this.owner}/${this.repo}/languages`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      ),
    ]);

    const repo = repoRes.data;
    const languages = languagesRes.data || {};

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
    const res = await axios.get(
      `https://api.github.com/repos/${this.owner}/${this.repo}/git/trees/${branch}?recursive=1`,
      { headers: { Authorization: `Bearer ${this.token}` } },
    );

    this.tree = res.data.tree;
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

    const filesToFetch = this.tree
      .filter((node) => node.type === "blob")
      .filter((node) =>
        importantPatterns.some((pattern) => pattern.test(node.path)),
      )
      .slice(0, 50); // Limit to avoid rate limits

    await Promise.all(
      filesToFetch.map((file) => this.fetchFileContent(file.path)),
    );
  }

  private async fetchFileContent(path: string): Promise<void> {
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/vnd.github.raw",
          },
          responseType: "text",
        },
      );

      this.fileContents.set(path, res.data);
    } catch (error) {
      console.error(`Failed to fetch ${path}:`, error);
    }
  }
}
