export interface RepoMetadata {
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  languages: Record<string, number>; // Language -> bytes of code
  topics: string[];
  stars: number;
  forks: number;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  size: number; // KB
  isPrivate: boolean;
  license: string | null;
}

export interface ArchitectureAnalysis {
  pattern: string; // "microservices" | "monolith" | "modular" | "layered" | "unknown"
  structure: {
    hasServices: boolean;
    hasModules: boolean;
    hasLayers: boolean;
    hasDomains: boolean;
  };
  folders: {
    path: string;
    purpose: string; // "service" | "module" | "layer" | "domain" | "utility"
  }[];
  conventions: {
    namingStyle: string; // "kebab-case" | "camelCase" | "snake_case"
    organizationBy: string; // "feature" | "type" | "layer"
  };
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: "runtime" | "dev" | "peer";
  category?: string; // "web-framework" | "database" | "testing" | "ui" | "utility"
}

export interface DependencyAnalysis {
  packageManager: string | null; // "npm" | "yarn" | "pnpm" | "pip" | "cargo" | "go" | "maven" | "gradle"
  dependencies: DependencyInfo[];
  frameworks: string[]; // Main frameworks detected
  databases: string[]; // Database libraries detected
  testing: string[]; // Testing frameworks
  buildTools: string[];
}

export interface DatabaseAnalysis {
  type: string | null; // "postgresql" | "mysql" | "mongodb" | "sqlite" | "redis"
  orm: string | null; // "prisma" | "typeorm" | "sequelize" | "mongoose" | "sqlalchemy"
  schemas: {
    file: string;
    content: string;
    tables?: string[];
    models?: string[];
  }[];
  migrations: {
    folder: string;
    count: number;
  }[];
}

export interface APIEndpoint {
  path: string;
  method?: string;
  file: string;
}

export interface APIAnalysis {
  type: string[]; // "REST" | "GraphQL" | "gRPC" | "WebSocket"
  endpoints: APIEndpoint[];
  schemas: {
    file: string;
    type: string; // "openapi" | "graphql" | "proto"
    content?: string;
  }[];
  routeFiles: string[];
}

export interface InfrastructureAnalysis {
  containerization: {
    hasDocker: boolean;
    hasDockerCompose: boolean;
    dockerfiles: string[];
    composeFiles: string[];
  };
  orchestration: {
    hasKubernetes: boolean;
    manifestFiles: string[];
  };
  iac: {
    tool: string | null; // "terraform" | "pulumi" | "cloudformation" | "helm"
    files: string[];
  };
  cicd: {
    platform: string | null; // "github-actions" | "gitlab-ci" | "circle-ci" | "jenkins"
    workflows: {
      file: string;
      jobs: string[];
    }[];
  };
  cloud: {
    provider: string | null; // "aws" | "gcp" | "azure" | "vercel" | "netlify"
    services: string[];
  };
}

export interface EnvironmentAnalysis {
  files: string[];
  variables: {
    name: string;
    description?: string;
    required: boolean;
  }[];
  services: string[]; // External services detected
  integrations: string[]; // Third-party integrations
}

export interface TestAnalysis {
  framework: string | null; // "jest" | "vitest" | "pytest" | "go test" | "junit"
  testFiles: {
    path: string;
    type: string; // "unit" | "integration" | "e2e" | "unknown"
  }[];
  coverage: {
    hasConfig: boolean;
    configFile?: string;
  };
  totalTests: number;
}

export interface MessagingAnalysis {
  hasMessaging: boolean;
  systems: string[]; // "rabbitmq" | "kafka" | "redis" | "aws-sqs" | "google-pubsub"
  patterns: string[]; // "queue" | "pub-sub" | "event-sourcing"
  files: string[];
}

export interface RepositoryAnalysis {
  metadata: RepoMetadata;
  architecture: ArchitectureAnalysis;
  dependencies: DependencyAnalysis;
  database: DatabaseAnalysis;
  apis: APIAnalysis;
  infrastructure: InfrastructureAnalysis;
  environment: EnvironmentAnalysis;
  tests: TestAnalysis;
  messaging: MessagingAnalysis;
  analyzedAt: string;
}

export interface AnalyzeRepositoryRequest {
  owner: string;
  repo: string;
  // Note: githubToken is no longer sent from frontend
  // It's retrieved server-side for security
}

export interface AnalyzeRepositoryResponse {
  success: boolean;
  data?: RepositoryAnalysis;
  error?: string;
}
