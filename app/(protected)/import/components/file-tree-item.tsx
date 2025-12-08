import { Folder, File, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileTreeNode } from "./file-browser-utils";

interface FileTreeItemProps {
  node: FileTreeNode;
  level?: number;
  expandedFolders: Set<string>;
  selectedFile: string | null;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
}

export function FileTreeItem({
  node,
  level = 0,
  expandedFolders,
  selectedFile,
  onToggleFolder,
  onSelectFile,
}: FileTreeItemProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile === node.path;
  const isFolder = node.type === "tree";

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-md transition-colors text-sm",
          isSelected && "bg-accent font-medium",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            onToggleFolder(node.path);
          } else {
            onSelectFile(node.path);
          }
        }}
      >
        {isFolder && (
          <span className="shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
        {!isFolder && <span className="w-4" />}
        {isFolder ? (
          <Folder className="w-4 h-4 text-blue-500 shrink-0" />
        ) : (
          <File className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              selectedFile={selectedFile}
              onToggleFolder={onToggleFolder}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
