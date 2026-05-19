import { HttpMethod, MarkdownExportInput } from "./export-markdown";
import { ArchitectureData } from "./types";

function normalizeHttpMethod(method: string): HttpMethod {
  const upper = method.toUpperCase();
  if (
    ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"].includes(upper)
  ) {
    return upper as HttpMethod;
  }
  throw new Error(`Invalid HTTP method: ${method}`);
}

export function mapArchitectureToMarkdownInput(
  architecture: ArchitectureData,
): MarkdownExportInput {
  return {
    title: architecture.systemName,
    description: architecture.summary,
    overview: architecture.summary,

    microservices: architecture.microservices.map((service) => ({
      name: service.name,
      description: service.responsibility,
      languageAndFramework: service.techStack,
      responsibilities: [service.responsibility],
      workflow: service.details.workflow,
      dependencies: service.details.integrationPoints,
      exposedEndpoints:
        architecture.apiRoutes
          .find((apiGroup) => apiGroup.service === service.name)
          ?.routes.map((route) => ({
            method: normalizeHttpMethod(route.method),
            path: route.path,
            description: route.description,
          })) ?? [],
    })),

    entities: architecture.entities.map((entity) => ({
      name: entity.name,
      type: architecture.databaseSchema.type.toLowerCase().includes("sql")
        ? "SQL Table"
        : "NoSQL Collection",
      fields: Object.entries(entity.fields).map(([name, type]) => ({
        name,
        type,
      })),
      description:
        Object.keys(entity.relations).length > 0
          ? `Relations: ${Object.entries(entity.relations)
              .map(([key, value]) => `${key} → ${value}`)
              .join(", ")}`
          : undefined,
    })),

    apiRoutes: architecture.apiRoutes.map((apiGroup) => ({
      serviceName: apiGroup.service,
      endPoints: apiGroup.routes.map((route) => ({
        method: normalizeHttpMethod(route.method),
        path: route.path,
        description: route.description,
        requestFormat: JSON.stringify(route.request, null, 2),
        responseFormat: JSON.stringify(route.response, null, 2),
      })),
    })),

    databaseSchemas: {
      name: `${architecture.systemName} Database`,
      type: architecture.databaseSchema.type.toLowerCase().includes("sql")
        ? "SQL"
        : architecture.databaseSchema.type.toLowerCase().includes("graph")
          ? "Graph"
          : architecture.databaseSchema.type.toLowerCase().includes("time")
            ? "Time-Series"
            : "NoSQL",
      description: `Database schema for ${architecture.systemName}`,
      tables: architecture.databaseSchema.collections.map((collection) => ({
        tableName: collection.name,
        fields: Object.entries(collection.fields).map(([name, type]) => ({
          name,
          type,
        })),
      })),
    },

    infrastructure: [
      {
        category: "Hosting",
        provider: architecture.infrastructure.hosting,
        description: architecture.infrastructure.hosting,
      },
      {
        category: "Database",
        provider: architecture.infrastructure.database,
        description: architecture.infrastructure.database,
      },
      {
        category: "Authentication",
        provider: architecture.infrastructure.auth,
        description: architecture.infrastructure.auth,
      },
      {
        category: "CDN",
        provider: architecture.infrastructure.cdn,
        description: architecture.infrastructure.cdn,
      },
      {
        category: "Scaling",
        provider: architecture.infrastructure.scaling,
        description: architecture.infrastructure.scaling,
      },
    ],

    mermaidDiagrams: architecture["Architecture Diagram"]
      ? [
          {
            title: "Architecture Diagram",
            description: `System architecture diagram for ${architecture.systemName}`,
            code: architecture["Architecture Diagram"],
          },
        ]
      : [],
  };
}
