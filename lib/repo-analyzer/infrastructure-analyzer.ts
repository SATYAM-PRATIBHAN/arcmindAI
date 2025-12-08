import { InfrastructureAnalysis } from "@/types/repository-analysis";
import { GitHubTreeNode, FILE_PATTERNS } from "./constants";

export class InfrastructureAnalyzer {
  private tree: GitHubTreeNode[];

  constructor(tree: GitHubTreeNode[]) {
    this.tree = tree;
  }

  analyze(): InfrastructureAnalysis {
    const dockerfiles = this.tree
      .filter((node) => FILE_PATTERNS.dockerfile.test(node.path))
      .map((n) => n.path);
    const composeFiles = this.tree
      .filter((node) => FILE_PATTERNS.dockerCompose.test(node.path))
      .map((n) => n.path);
    const kubeFiles = this.tree
      .filter((node) => FILE_PATTERNS.kubernetes.test(node.path))
      .map((n) => n.path);
    const terraformFiles = this.tree
      .filter((node) => FILE_PATTERNS.terraform.test(node.path))
      .map((n) => n.path);
    const workflowFiles = this.tree
      .filter((node) => FILE_PATTERNS.githubActions.test(node.path))
      .map((n) => n.path);

    let iacTool: string | null = null;
    if (terraformFiles.length > 0) iacTool = "terraform";
    else if (this.tree.some((n) => /pulumi/i.test(n.path))) iacTool = "pulumi";

    let cicdPlatform: string | null = null;
    if (workflowFiles.length > 0) cicdPlatform = "github-actions";
    else if (this.tree.some((n) => FILE_PATTERNS.gitlabCi.test(n.path)))
      cicdPlatform = "gitlab-ci";

    return {
      containerization: {
        hasDocker: dockerfiles.length > 0,
        hasDockerCompose: composeFiles.length > 0,
        dockerfiles,
        composeFiles,
      },
      orchestration: {
        hasKubernetes: kubeFiles.length > 0,
        manifestFiles: kubeFiles,
      },
      iac: {
        tool: iacTool,
        files: terraformFiles,
      },
      cicd: {
        platform: cicdPlatform,
        workflows: workflowFiles.map((file) => ({
          file,
          jobs: [],
        })),
      },
      cloud: {
        provider: null,
        services: [],
      },
    };
  }
}
