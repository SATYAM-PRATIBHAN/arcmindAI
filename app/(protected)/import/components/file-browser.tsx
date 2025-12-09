"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { buildFileTree, FileTreeNode } from "./file-browser-utils";
import { FileBrowserHeader } from "./file-browser-header";
import { FileBreadcrumb } from "./file-breadcrumb";
import { FileSidebar } from "./file-sidebar";
import { FileContentViewer } from "./file-content-viewer";
import { DOC_ROUTES } from "@/lib/routes";

export function FileBrowser() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch repository tree
  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true);
      try {
        // First get the default branch via proxy
        const repoRes = await axios.get(DOC_ROUTES.API.GITHUB.REPO_INFO, {
          params: { owner, repo },
        });

        if (!repoRes.data.success) {
          throw new Error(repoRes.data.message || "Failed to fetch repo info");
        }

        const defaultBranch = repoRes.data.data.default_branch;

        // Get the tree recursively via proxy
        const treeRes = await axios.get(DOC_ROUTES.API.GITHUB.REPO_TREE, {
          params: { owner, repo, branch: defaultBranch },
        });

        if (!treeRes.data.success) {
          throw new Error(treeRes.data.message || "Failed to fetch repo tree");
        }

        const tree = buildFileTree(treeRes.data.data.tree);
        setFileTree(tree);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load repository structure");
      } finally {
        setLoading(false);
      }
    };

    fetchTree();
  }, [owner, repo]);

  const handleToggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelectFile = async (path: string) => {
    setSelectedFile(path);
    setLoadingContent(true);

    // Close sidebar on mobile when file is selected
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }

    try {
      // Fetch file content via proxy endpoint
      const res = await axios.get(DOC_ROUTES.API.GITHUB.FILE_CONTENT, {
        params: { owner, repo, path },
      });

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to fetch file content");
      }

      setFileContent(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load file content");
    } finally {
      setLoadingContent(false);
    }
  };

  const handleBackToFiles = () => {
    setSelectedFile(null);
    setSidebarOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FileBrowserHeader
        owner={owner}
        repo={repo}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {selectedFile && (
        <FileBreadcrumb
          selectedFile={selectedFile}
          onBack={handleBackToFiles}
        />
      )}

      {/* Two-panel layout */}
      <div className="flex gap-4" style={{ height: "calc(80vh - 50px)" }}>
        <FileSidebar
          fileTree={fileTree}
          expandedFolders={expandedFolders}
          selectedFile={selectedFile}
          sidebarOpen={sidebarOpen}
          onToggleFolder={handleToggleFolder}
          onSelectFile={handleSelectFile}
        />

        {/* Main Content Panel */}
        <div className="flex-1 border rounded-lg overflow-hidden h-full flex flex-col">
          <FileContentViewer
            selectedFile={selectedFile}
            fileContent={fileContent}
            loadingContent={loadingContent}
            onClose={() => setSelectedFile(null)}
          />
        </div>
      </div>
    </div>
  );
}
