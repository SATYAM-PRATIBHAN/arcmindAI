import { cn } from "@/lib/utils";
import { FileTreeNode } from "./file-browser-utils";
import { FileTreeItem } from "./file-tree-item";

interface FileSidebarProps {
  fileTree: FileTreeNode[];
  expandedFolders: Set<string>;
  selectedFile: string | null;
  sidebarOpen: boolean;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
}

export function FileSidebar({
  fileTree,
  expandedFolders,
  selectedFile,
  sidebarOpen,
  onToggleFolder,
  onSelectFile,
}: FileSidebarProps) {
  return (
    <div
      className={cn(
        "w-full lg:w-80 border rounded-lg p-4 overflow-y-auto transition-all h-full",
        "lg:block",
        sidebarOpen ? "block" : "hidden",
      )}
    >
      <h2 className="font-semibold mb-3 text-sm text-muted-foreground uppercase">
        Files
      </h2>
      {fileTree.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This repository is empty
        </p>
      ) : (
        <div className="space-y-0.5">
          {fileTree.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
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
