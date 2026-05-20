import { MarkdownExportInput } from "./export-markdown";
import { ArchitectureData } from "./types";
import { mapArchitectureToMarkdownInput } from "./mapArchitectureToMarkdownInput";

export function generateMarkdown(input: MarkdownExportInput): string {
  const lines: string[] = [];

  lines.push(`# ${input.title}`);
  lines.push("");
  lines.push(`## Summary`);
  lines.push("");
  lines.push(input.description);
  lines.push("");

  lines.push(`## Overview`);
  lines.push("");
  lines.push(input.overview);
  lines.push("");

  if (input.microservices?.length) {
    lines.push(`## Microservices`);
    lines.push("");

    input.microservices.forEach((service) => {
      lines.push(`### ${service.name}`);
      lines.push("");

      if (service.description) {
        lines.push(service.description);
        lines.push("");
      }

      if (service.languageAndFramework?.length) {
        lines.push(
          `**Tech Stack:** ${service.languageAndFramework.join(", ")}`,
        );
        lines.push("");
      }

      if (service.responsibilities?.length) {
        lines.push(`**Responsibilities:**`);
        lines.push("");
        service.responsibilities.forEach((item) => {
          lines.push(`- ${item}`);
        });
        lines.push("");
      }

      if (service.workflow) {
        lines.push(`**Workflow:**`);
        lines.push("");
        lines.push(service.workflow);
        lines.push("");
      }

      if (service.dependencies?.length) {
        lines.push(`**Dependencies / Integration Points:**`);
        lines.push("");
        service.dependencies.forEach((dep) => {
          lines.push(`- ${dep}`);
        });
        lines.push("");
      }

      if (service.exposedEndpoints?.length) {
        lines.push(`**Exposed Endpoints:**`);
        lines.push("");
        service.exposedEndpoints.forEach((endpoint) => {
          lines.push(
            `- \`${endpoint.method} ${endpoint.path}\` - ${endpoint.description ?? ""}`,
          );
        });
        lines.push("");
      }
    });
  }

  if (input.entities?.length) {
    lines.push(`## Entities`);
    lines.push("");

    input.entities.forEach((entity) => {
      lines.push(`### ${entity.name}`);
      lines.push("");
      lines.push(`**Type:** ${entity.type}`);
      lines.push("");

      if (entity.description) {
        lines.push(entity.description);
        lines.push("");
      }

      if (entity.fields?.length) {
        lines.push(`| Field | Type | Constraints | Description |`);
        lines.push(`|---|---|---|---|`);

        entity.fields.forEach((field) => {
          lines.push(
            `| ${field.name} | ${field.type} | ${field.constraints ?? "-"} | ${field.description ?? "-"} |`,
          );
        });

        lines.push("");
      }
    });
  }

  if (input.apiRoutes?.length) {
    lines.push(`## API Routes`);
    lines.push("");

    input.apiRoutes.forEach((apiGroup) => {
      lines.push(`### ${apiGroup.serviceName}`);
      lines.push("");

      apiGroup.endPoints.forEach((endpoint) => {
        lines.push(`#### ${endpoint.method} ${endpoint.path}`);
        lines.push("");

        if (endpoint.description) {
          lines.push(endpoint.description);
          lines.push("");
        }

        if (endpoint.requestFormat) {
          lines.push(`**Request:**`);
          lines.push("");
          lines.push("```json");
          lines.push(endpoint.requestFormat);
          lines.push("```");
          lines.push("");
        }

        if (endpoint.responseFormat) {
          lines.push(`**Response:**`);
          lines.push("");
          lines.push("```json");
          lines.push(endpoint.responseFormat);
          lines.push("```");
          lines.push("");
        }
      });
    });
  }

  if (input.databaseSchemas) {
    lines.push(`## Database Schema`);
    lines.push("");
    lines.push(`**Name:** ${input.databaseSchemas.name}`);
    lines.push("");
    lines.push(`**Type:** ${input.databaseSchemas.type}`);
    lines.push("");

    if (input.databaseSchemas.description) {
      lines.push(input.databaseSchemas.description);
      lines.push("");
    }

    input.databaseSchemas.tables?.forEach((table) => {
      lines.push(`### ${table.tableName}`);
      lines.push("");

      if (table.description) {
        lines.push(table.description);
        lines.push("");
      }

      lines.push(
        `| Field | Type | Primary Key | Foreign Key | Unique | Nullable | Default | Description |`,
      );
      lines.push(`|---|---|---|---|---|---|---|---|`);

      table.fields.forEach((field) => {
        lines.push(
          `| ${field.name} | ${field.type} | ${field.isPrimaryKey ? "Yes" : "No"} | ${field.isForeignKey ? "Yes" : "No"} | ${field.isUnique ? "Yes" : "No"} | ${field.isNullable ? "Yes" : "No"} | ${field.defaultValue ?? "-"} | ${field.description ?? "-"} |`,
        );
      });

      lines.push("");
    });
  }

  if (input.infrastructure?.length) {
    lines.push(`## Infrastructure`);
    lines.push("");

    lines.push(`| Category | Provider | Description |`);
    lines.push(`|---|---|---|`);

    input.infrastructure.forEach((item) => {
      lines.push(
        `| ${item.category ?? "-"} | ${item.provider ?? "-"} | ${item.description ?? "-"} |`,
      );
    });

    lines.push("");
  }

  if (input.mermaidDiagrams?.length) {
    lines.push(`## Diagrams`);
    lines.push("");

    input.mermaidDiagrams.forEach((diagram) => {
      lines.push(`### ${diagram.title}`);
      lines.push("");

      if (diagram.description) {
        lines.push(diagram.description);
        lines.push("");
      }

      lines.push("```mermaid");
      lines.push(diagram.code);
      lines.push("```");
      lines.push("");
    });
  }

  return lines.join("\n");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function downloadMarkdownFile(
  data: ArchitectureData | string,
  title?: string,
): void {
  let markdown: string;
  let finalTitle: string;

  if (typeof data === "string") {
    finalTitle = title || "GitHub Repository Design";
    markdown = `# ${finalTitle}\n\n## Architecture Diagram\n\n\`\`\`mermaid\n${data}\n\`\`\``;
  } else {
    const markdownInput = mapArchitectureToMarkdownInput(data);
    markdown = generateMarkdown(markdownInput);
    finalTitle = markdownInput.title || "architecture";
  }

  const slug = slugify(finalTitle);
  const timestamp = getTimestamp();

  const fileName = `${slug}-${timestamp}.md`;

  const blob = new Blob([markdown], {
    type: "text/markdown;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();

  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
