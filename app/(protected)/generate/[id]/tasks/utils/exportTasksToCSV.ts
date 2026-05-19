interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  estimatedHours: number;
  dependencies: string[];
}

function escapeCSVCell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Resolves dependency task IDs to their human-readable titles.
 * Falls back to the raw ID if no matching task is found.
 */
function resolveDependencies(dependencies: string[], allTasks: Task[]): string {
  if (!dependencies || dependencies.length === 0) return "";
  return dependencies
    .map((depId) => {
      const found = allTasks.find((t) => t.id === depId);
      return found ? found.title : depId;
    })
    .join("; ");
}

/**
 * Converts an array of tasks into a CSV string and triggers a file download.
 *
 * Columns:
 *   Task ID | Title | Description | Category | Priority | Estimated Hours | Dependencies
 *
 * @param tasks     - The flat list of all tasks.
 * @param filename  - The filename for the downloaded file (without extension).
 */
export function exportTasksToCSV(tasks: Task[], filename = "tasks"): void {
  const headers = [
    "Task ID",
    "Title",
    "Description",
    "Category",
    "Priority",
    "Estimated Hours",
    "Dependencies",
  ];

  const rows = tasks.map((task) => [
    escapeCSVCell(task.id),
    escapeCSVCell(task.title),
    escapeCSVCell(task.description),
    escapeCSVCell(task.category),
    escapeCSVCell(task.priority),
    escapeCSVCell(task.estimatedHours),
    escapeCSVCell(resolveDependencies(task.dependencies, tasks)),
  ]);

  const csvContent = [
    headers.map(escapeCSVCell).join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Prefix with BOM so Excel opens it correctly with UTF-8 encoding
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release the object URL to free memory
  URL.revokeObjectURL(url);
}
