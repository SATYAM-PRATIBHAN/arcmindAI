"use client";

import { DOC_ROUTES } from "@/lib/routes";
import axios from "axios";
// Added AlertTriangle to render safeguard boundary warnings
import { Loader2, AlertTriangle } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGithubBranches } from "../hooks/useGithubBranches";
import { FileBreadcrumb } from "./file-breadcrumb";
import { FileBrowserHeader } from "./file-browser-header";
import { buildFileTree, FileTreeNode } from "./file-browser-utils";
import { FileContentViewer } from "./file-content-viewer";
import { FileSidebar } from "./file-sidebar";
import { GitBranchSelect } from "./github-branch-select";

// 4. UI ENHANCEMENT: Expose warning message and skipped file counts as optional props
interface FileBrowserProps {
  warningMessage?: string | null;
  skippedCount?: number;
}

export function FileBrowser({
  warningMessage,
  skippedCount = 0,
}: FileBrowserProps) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const branchParam = searchParams.get("branch");

  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);

  const activeBranch = branchParam || defaultBranch;

  const { branches, loading: branchesLoading } = useGithubBranches(owner, repo);

  // Fetch repository tree
  useEffect(() => {
    let isMounted = true; // FIX: Prevents race conditions on rapid state adjustments

    const fetchTree = async () => {
      setLoading(true);
      // FIX: Flush out stale data structure arrays before caching/fetching the new data
      setFileTree([]);

      try {
        let branch = branchParam;

        // First get the default branch via proxy
        if (!branch || !defaultBranch) {
          const repoRes = await axios.get(DOC_ROUTES.API.GITHUB.REPO_INFO, {
            params: { owner, repo },
          });

          if (!repoRes.data.success) {
            throw new Error(
              repoRes.data.message || "Failed to fetch repo info",
            );
          }

          const resolvedDefaultBranch = repoRes.data.data.default_branch;
          if (isMounted) setDefaultBranch(resolvedDefaultBranch);
          if (!branch) branch = resolvedDefaultBranch;
        }

        // Get the tree recursively via proxy
        const treeRes = await axios.get(DOC_ROUTES.API.GITHUB.REPO_TREE, {
          params: { owner, repo, branch },
        });

        if (!treeRes.data.success) {
          throw new Error(treeRes.data.message || "Failed to fetch repo tree");
        }

        if (isMounted) {
          const tree = buildFileTree(treeRes.data.data.tree);
          setFileTree(tree);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) toast.error("Failed to load repository structure");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTree();

    return () => {
      isMounted = false; // Cleanup execution loop tracking on dependencies change
    };
  }, [owner, repo, branchParam, defaultBranch]);

  const handleBranchChange = (branch: string) => {
    if (branch === activeBranch) return;

    // FIX: Completely isolate and purge active viewer buffers prior to pushing route state mutations
    setSelectedFile(null);
    setFileContent("");

    const next = new URLSearchParams(searchParams.toString());
    next.set("branch", branch);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

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

    // Close sidebar on mobile devices layout natively
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }

    try {
      // Fetch file content via proxy endpoint
      const res = await axios.get(DOC_ROUTES.API.GITHUB.FILE_CONTENT, {
        params: {
          owner,
          repo,
          path,
          ...(activeBranch ? { branch: activeBranch } : {}),
        },
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

      {/* RENDER ACTIVE LIMIT WARNING BANNER DIRECTLY INSIDE FILE BROWSER DASHBOARD */}
      {warningMessage && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl flex gap-3 text-xs leading-relaxed animate-in fade-in duration-200">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-200 block">
              Active Repository Scanning Optimizations
            </span>
            <p className="text-amber-300/80">
              {warningMessage}{" "}
              {skippedCount > 0
                ? `(Bypassed ${skippedCount} non-critical entries)`
                : ""}
            </p>
            <div className="text-[10px] text-slate-400/50 font-mono italic">
              * Safety thresholds and parsing depth filters are strictly
              enforced to preserve AI memory boundaries.
            </div>
          </div>
        </div>
      )}

      {/* Git repo branch select layout */}
      <div className="flex items-center gap-4 flex-wrap">
        <GitBranchSelect
          branches={branches}
          selectedBranch={activeBranch || ""}
          defaultBranch={defaultBranch || undefined}
          loading={branchesLoading}
          onSelect={handleBranchChange}
        />
        <span className="text-sm text-muted-foreground">
          {branches.length > 0
            ? `${branches.length} ${branches.length === 1 ? "branch" : "branches"}`
            : null}
        </span>
      </div>

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
        <div className="flex-1 border rounded-lg overflow-hidden h-full flex flex-col bg-background">
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
