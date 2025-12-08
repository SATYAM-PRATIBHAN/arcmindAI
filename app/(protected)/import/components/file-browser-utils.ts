export interface TreeNode {
  path: string;
  type: "tree" | "blob";
  sha: string;
  size?: number;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: "tree" | "blob";
  children?: FileTreeNode[];
  size?: number;
}

export const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    py: "python",
    rb: "ruby",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    php: "php",
    go: "go",
    rs: "rust",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    yml: "yaml",
    yaml: "yaml",
    json: "json",
    xml: "xml",
    html: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    md: "markdown",
    sql: "sql",
    graphql: "graphql",
    dockerfile: "dockerfile",
  };
  return languageMap[ext || ""] || "text";
};

// Build tree structure from flat list of nodes
export function buildFileTree(nodes: TreeNode[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const pathMap = new Map<string, FileTreeNode>();

  // Sort nodes by path to ensure parents come before children
  const sortedNodes = [...nodes].sort((a, b) => a.path.localeCompare(b.path));

  for (const node of sortedNodes) {
    const parts = node.path.split("/");
    const name = parts[parts.length - 1];

    const fileNode: FileTreeNode = {
      name,
      path: node.path,
      type: node.type,
      children: node.type === "tree" ? [] : undefined,
      size: node.size,
    };

    pathMap.set(node.path, fileNode);

    if (parts.length === 1) {
      // Root level
      root.push(fileNode);
    } else {
      // Find parent
      const parentPath = parts.slice(0, -1).join("/");
      const parent = pathMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(fileNode);
      }
    }
  }

  return root;
}
