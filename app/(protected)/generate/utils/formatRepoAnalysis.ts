import { RepositoryAnalysis } from "@/types/repository-analysis";

export function formatRepositoryAnalysisForAI(
  owner: string,
  repo: string,
  analysis: RepositoryAnalysis,
): string {
  return `
# Repository Analysis: ${owner}/${repo}

## METADATA
- **Name**: ${analysis.metadata.name}
- **Description**: ${analysis.metadata.description || "No description"}
- **Primary Language**: ${analysis.metadata.language || "Unknown"}
- **Stars**: ${analysis.metadata.stars}
- **License**: ${analysis.metadata.license || "None"}
- **Languages Used**: ${Object.keys(analysis.metadata.languages).join(", ")}

## ARCHITECTURE
- **Pattern**: ${analysis.architecture.pattern}
- **Has Services**: ${analysis.architecture.structure.hasServices}
- **Has Modules**: ${analysis.architecture.structure.hasModules}
- **Has Layers**: ${analysis.architecture.structure.hasLayers}
- **Has Domains**: ${analysis.architecture.structure.hasDomains}
- **Organization**: ${analysis.architecture.conventions.organizationBy}
- **Naming Style**: ${analysis.architecture.conventions.namingStyle}

### Key Folders:
${analysis.architecture.folders
  .slice(0, 15)
  .map((f) => `- ${f.path} (${f.purpose})`)
  .join("\n")}

## DEPENDENCIES
- **Package Manager**: ${analysis.dependencies.packageManager || "Unknown"}
- **Total Dependencies**: ${analysis.dependencies.dependencies.length}

### Frameworks:
${analysis.dependencies.frameworks.length > 0 ? analysis.dependencies.frameworks.join(", ") : "None detected"}

### Databases:
${analysis.dependencies.databases.length > 0 ? analysis.dependencies.databases.join(", ") : "None detected"}

### Testing:
${analysis.dependencies.testing.length > 0 ? analysis.dependencies.testing.join(", ") : "None detected"}

### Key Dependencies:
${analysis.dependencies.dependencies
  .filter((d) => d.type === "runtime")
  .slice(0, 10)
  .map((d) => `- ${d.name}@${d.version} (${d.category || "utility"})`)
  .join("\n")}

## DATABASE
- **Type**: ${analysis.database.type || "Unknown"}
- **ORM**: ${analysis.database.orm || "None"}
- **Schemas Found**: ${analysis.database.schemas.length}
- **Migration Folders**: ${analysis.database.migrations.length}

${
  analysis.database.schemas.length > 0
    ? `### Models:\n${analysis.database.schemas
        .flatMap((s) => s.models || [])
        .slice(0, 10)
        .map((m) => `- ${m}`)
        .join("\n")}`
    : ""
}

## APIs
- **Types**: ${analysis.apis.type.length > 0 ? analysis.apis.type.join(", ") : "Unknown"}
- **Route Files**: ${analysis.apis.routeFiles.length}

### API Files:
${analysis.apis.routeFiles
  .slice(0, 10)
  .map((f) => `- ${f}`)
  .join("\n")}

${
  analysis.apis.schemas.length > 0
    ? `### Schemas:\n${analysis.apis.schemas.map((s) => `- ${s.file} (${s.type})`).join("\n")}`
    : ""
}

## INFRASTRUCTURE

### Containerization:
- **Docker**: ${analysis.infrastructure.containerization.hasDocker}
- **Docker Compose**: ${analysis.infrastructure.containerization.hasDockerCompose}
${
  analysis.infrastructure.containerization.dockerfiles.length > 0
    ? `- Dockerfiles: ${analysis.infrastructure.containerization.dockerfiles.join(", ")}`
    : ""
}

### Orchestration:
- **Kubernetes**: ${analysis.infrastructure.orchestration.hasKubernetes}
${
  analysis.infrastructure.orchestration.manifestFiles.length > 0
    ? `- Manifests: ${analysis.infrastructure.orchestration.manifestFiles.length} files`
    : ""
}

### Infrastructure as Code:
- **Tool**: ${analysis.infrastructure.iac.tool || "None"}
${analysis.infrastructure.iac.files.length > 0 ? `- Files: ${analysis.infrastructure.iac.files.length}` : ""}

### CI/CD:
- **Platform**: ${analysis.infrastructure.cicd.platform || "None"}
- **Workflows**: ${analysis.infrastructure.cicd.workflows.length}

## ENVIRONMENT
- **Environment Files**: ${analysis.environment.files.length}
- **Variables Defined**: ${analysis.environment.variables.length}

### External Services:
${analysis.environment.services.length > 0 ? analysis.environment.services.map((s) => `- ${s}`).join("\n") : "None detected"}

### Integrations:
${analysis.environment.integrations.length > 0 ? analysis.environment.integrations.map((i) => `- ${i}`).join("\n") : "None detected"}

## TESTS
- **Framework**: ${analysis.tests.framework || "Unknown"}
- **Total Test Files**: ${analysis.tests.totalTests}
- **Has Coverage Config**: ${analysis.tests.coverage.hasConfig}

### Test Types:
${analysis.tests.testFiles
  .reduce(
    (acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  )
  .toString()}

## MESSAGING
- **Has Messaging**: ${analysis.messaging.hasMessaging}
${analysis.messaging.systems.length > 0 ? `- **Systems**: ${analysis.messaging.systems.join(", ")}` : ""}
${analysis.messaging.patterns.length > 0 ? `- **Patterns**: ${analysis.messaging.patterns.join(", ")}` : ""}

---

Based on this analysis, generate a comprehensive Mermaid diagram showing the system architecture.
`.trim();
}
