import axios, { type AxiosError } from "axios";

export interface GithubIssueTask {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  estimatedHours: number;
  dependencies: string[];
}

export interface CreatedGithubIssue {
  taskId: string;
  title: string;
  number: number;
  url: string;
}

export interface FailedGithubIssue {
  taskId: string;
  title: string;
  error: string;
}

const CATEGORY_LABELS = new Set([
  "frontend",
  "backend",
  "database",
  "devops",
  "testing",
  "documentation",
]);

const LABEL_COLORS: Record<string, string> = {
  "priority:high": "d73a4a",
  "priority:medium": "fbca04",
  "priority:low": "0e8a16",
  frontend: "1d76db",
  backend: "5319e7",
  database: "006b75",
  devops: "0052cc",
  testing: "c2e0c6",
  documentation: "0075ca",
};

export function buildGithubIssueBody(task: GithubIssueTask) {
  const priority =
    task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
  const category =
    task.category.charAt(0).toUpperCase() + task.category.slice(1);
  const dependencies =
    task.dependencies.length > 0 ? task.dependencies.join(", ") : "None";

  return `## Task Information

Priority: ${priority}

Estimated Hours: ${task.estimatedHours}

Category: ${category}

Dependencies: ${dependencies}

---

## Description

${task.description}`;
}

export function buildGithubIssueLabels(task: GithubIssueTask) {
  const labels = [`priority:${task.priority.toLowerCase()}`];
  const category = task.category.toLowerCase();

  if (CATEGORY_LABELS.has(category)) {
    labels.push(category);
  }

  return labels;
}

export function getGithubErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    const message = data?.message || error.message;

    if (error.response?.status === 403) {
      return `Missing permissions or rate limited: ${message}`;
    }

    if (error.response?.status === 404) {
      return `Repository or resource not found: ${message}`;
    }

    return message;
  }

  return error instanceof Error ? error.message : "Unknown GitHub API error";
}

export async function verifyGithubRepositoryAccess(
  githubToken: string,
  owner: string,
  repo: string,
) {
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: getGithubHeaders(githubToken),
    },
  );

  if (response.data?.has_issues === false) {
    throw new Error("Issues are disabled for this repository");
  }
}

export async function ensureGithubLabels(
  githubToken: string,
  owner: string,
  repo: string,
  labels: string[],
) {
  for (const label of labels) {
    try {
      await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/labels/${encodeURIComponent(label)}`,
        { headers: getGithubHeaders(githubToken) },
      );
    } catch (error) {
      if (!isGithubNotFound(error)) {
        throw error;
      }

      await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/labels`,
        {
          name: label,
          color: LABEL_COLORS[label] || "ededed",
        },
        { headers: getGithubHeaders(githubToken) },
      );
    }
  }
}

export async function createGithubIssue(
  githubToken: string,
  owner: string,
  repo: string,
  task: GithubIssueTask,
): Promise<CreatedGithubIssue> {
  const labels = buildGithubIssueLabels(task);
  await ensureGithubLabels(githubToken, owner, repo, labels);

  const response = await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      title: task.title,
      body: buildGithubIssueBody(task),
      labels,
    },
    { headers: getGithubHeaders(githubToken) },
  );

  return {
    taskId: task.id,
    title: task.title,
    number: response.data.number,
    url: response.data.html_url,
  };
}

function getGithubHeaders(githubToken: string) {
  return {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github.v3+json",
  };
}

function isGithubNotFound(error: unknown): error is AxiosError {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
