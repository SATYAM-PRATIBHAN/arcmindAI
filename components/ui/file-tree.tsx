import { Folder, File } from "lucide-react";

export type FileTree = {
  [key: string]: FileTree | null;
};

export function buildTree(paths: string[]): FileTree {
  const tree: FileTree = {};

  paths.forEach((path) => {
    const parts = path.replace(/^src\//, "").split("/");
    let current: FileTree = tree;

    parts.forEach((part) => {
      const isFile = part.includes(".");

      if (!(part in current)) {
        current[part] = isFile ? null : {};
      }

      if (!isFile && current[part]) {
        current = current[part] as FileTree;
      }
    });
  });

  return tree;
}

export function TreeView({
  node,
  depth = 0,
}: {
  node: FileTree;
  depth?: number;
}) {
  return (
    <>
      {Object.entries(node).map(([name, value]) => {
        const isFile = value === null;

        return (
          <div key={name}>
            <div
              className="flex items-center gap-2 py-1"
              style={{ paddingLeft: `${depth * 16}px` }}
            >
              {isFile ? (
                <File className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-yellow-500" />
              )}
              <span>{name}</span>
            </div>

            {!isFile && value && <TreeView node={value} depth={depth + 1} />}
          </div>
        );
      })}
    </>
  );
}

export function FileTreeRenderer({ tree }: { tree: string[] }) {
  const nestedTree = buildTree(tree);

  return (
    <div className="font-mono text-sm bg-muted p-4 rounded-xl border overflow-auto max-h-[500px]">
      <TreeView node={nestedTree} />
    </div>
  );
}
