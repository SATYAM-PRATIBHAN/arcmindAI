// File pattern matchers for categorizing repository files
export const FILE_PATTERNS = {
  // Package managers
  packageJson: /(^|\/)package\.json$/,
  requirementsTxt: /(^|\/)requirements\.txt$/,
  goMod: /(^|\/)go\.mod$/,
  cargoToml: /(^|\/)Cargo\.toml$/,
  pomXml: /(^|\/)pom\.xml$/,
  buildGradle: /(^|\/)build\.gradle(\.kts)?$/,
  gemfile: /(^|\/)Gemfile$/,

  // Database
  prismaSchema: /schema\.prisma$/,
  sqlFiles: /\.sql$/,
  migrations: /migrations?\//i,
  models: /(models?|entities)\//i,

  // APIs
  routes: /(routes?|controllers?|api)\//i,
  graphql: /\.graphql$/,
  proto: /\.proto$/,
  openapi: /(openapi|swagger)\.(json|ya?ml)$/,

  // Environment
  envExample: /\.env\.(example|sample|template)$/,
  envFile: /(^|\/)\.env$/,

  // Infrastructure
  dockerfile: /(^|\/)Dockerfile/,
  dockerCompose: /docker-compose.*\.ya?ml$/,
  kubernetes: /(k8s|kubernetes)\//i,
  kubeManifests: /\.(deployment|service|ingress|configmap)\.ya?ml$/,
  terraform: /\.tf$/,
  helm: /Chart\.ya?ml$/,

  // CI/CD
  githubActions: /(^|\/)\.github\/workflows\//,
  gitlabCi: /(^|\/)\.gitlab-ci\.ya?ml$/,
  circleCi: /(^|\/)\.circleci\/config\.ya?ml$/,
  jenkinsfile: /(^|\/)Jenkinsfile$/,

  // Tests
  testFiles: /\.(test|spec)\.(ts|tsx|js|jsx|py|go|java)$/,
  testDirs: /(tests?|__tests__|spec)\//i,

  // Messaging
  messaging: /(queue|event|message|pubsub|kafka|rabbitmq)\//i,
};

export interface GitHubTreeNode {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export const getFileByPattern = (
  fileContents: Map<string, string>,
  pattern: RegExp,
): { path: string; content: string } | undefined => {
  const entries = Array.from(fileContents.entries())
    .filter(([path]) => pattern.test(path))
    .sort((a, b) => {
      const depthA = a[0].split("/").length;
      const depthB = b[0].split("/").length;
      if (depthA !== depthB) {
        return depthA - depthB;
      }
      return a[0].localeCompare(b[0]);
    });

  const entry = entries[0];
  if (!entry) return undefined;
  return { path: entry[0], content: entry[1] };
};

export const getFileContentByPattern = (
  fileContents: Map<string, string>,
  pattern: RegExp,
): string | undefined => {
  return getFileByPattern(fileContents, pattern)?.content;
};
