import { MessagingAnalysis } from "@/types/repository-analysis";
import { GitHubTreeNode, FILE_PATTERNS } from "./constants";

export class MessagingAnalyzer {
  private tree: GitHubTreeNode[];
  private fileContents: Map<string, string>;

  constructor(tree: GitHubTreeNode[], fileContents: Map<string, string>) {
    this.tree = tree;
    this.fileContents = fileContents;
  }

  analyze(): MessagingAnalysis {
    const messagingFiles = this.tree.filter((node) =>
      FILE_PATTERNS.messaging.test(node.path),
    );

    const systems: string[] = [];
    const patterns: string[] = [];

    // Detect messaging systems from dependencies
    const packageJson = this.fileContents.get("package.json");
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps.amqplib || allDeps.rabbitmq) systems.push("rabbitmq");
        if (allDeps.kafkajs) systems.push("kafka");
        if (allDeps.ioredis && messagingFiles.length > 0) systems.push("redis");
      } catch (error) {
        console.error("Failed to parse package.json", error);
      }
    }

    if (messagingFiles.some((f) => /queue/.test(f.path)))
      patterns.push("queue");
    if (messagingFiles.some((f) => /pubsub|pub-sub/.test(f.path)))
      patterns.push("pub-sub");

    return {
      hasMessaging: messagingFiles.length > 0 || systems.length > 0,
      systems,
      patterns,
      files: messagingFiles.map((f) => f.path),
    };
  }
}
