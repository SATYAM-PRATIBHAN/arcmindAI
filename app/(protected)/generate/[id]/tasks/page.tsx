"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ListTodo,
  Download,
  Sparkles,
  Github,
  ExternalLink,
} from "lucide-react";
import Lottie from "lottie-react";
import animationData from "@/components/loaderLottie.json";
import axios from "axios";
import { toast } from "sonner";

import { useGetTasks } from "../../hooks/useGetTasks";
import TasksSection from "./components/TasksSection";
import { DOC_ROUTES } from "@/lib/routes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  estimatedHours: number;
  dependencies: string[];
}

interface TasksData {
  tasks: Task[];
}

interface Repository {
  id: number;
  full_name: string;
  private: boolean;
}

interface CreatedGithubIssue {
  taskId: string;
  title: string;
  number: number;
  url: string;
}

interface FailedGithubIssue {
  taskId: string;
  title: string;
  error: string;
}

interface ExportResult {
  total: number;
  createdIssues: CreatedGithubIssue[];
  failedIssues: FailedGithubIssue[];
}

export default function TasksPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getTasks, isLoading, error } = useGetTasks();

  const [tasksData, setTasksData] = useState<TasksData | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [reposError, setReposError] = useState<string | null>(null);
  const [selectedRepository, setSelectedRepository] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingGithubTasks, setPendingGithubTasks] = useState<Task[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isGithubExporting, setIsGithubExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    const fetchTasks = async () => {
      if (id && typeof id === "string" && !hasFetched.current) {
        hasFetched.current = true;
        const result = await getTasks(id);
        if (result && result.success) {
          setTasksData(result.tasks);
          setFromCache(result.fromCache);
        }
      }
    };
    fetchTasks();
  }, [id, getTasks]);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await axios.get(DOC_ROUTES.API.GITHUB.REPOS);

        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch repositories");
        }

        setRepos(res.data.repos);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setReposError(message);
      } finally {
        setReposLoading(false);
      }
    };

    fetchRepos();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Lottie
          animationData={animationData}
          loop
          style={{ width: 400, height: 400 }}
        />
        <p className="text-lg text-muted-foreground mt-4">
          {fromCache ? "Loading tasks..." : "Generating task breakdown..."}
        </p>
      </div>
    );
  }

  if (error || !tasksData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-4">
            <p className="text-destructive">
              {error || "Failed to load tasks. Please try again."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group tasks by category
  const tasksByCategory = tasksData.tasks.reduce(
    (acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push(task);
      return acc;
    },
    {} as Record<string, Task[]>,
  );

  // Calculate total statistics
  const totalTasks = tasksData.tasks.length;
  const totalHours = tasksData.tasks.reduce(
    (sum, task) => sum + task.estimatedHours,
    0,
  );
  const highPriorityCount = tasksData.tasks.filter(
    (task) => task.priority === "high",
  ).length;
  const selectedTasks = tasksData.tasks.filter((task) =>
    selectedTaskIds.has(task.id),
  );
  const isGithubAvailable = !reposLoading && !reposError && repos.length > 0;

  const handleDownloadCSV = async () => {
    if (!tasksData) return;
    setIsExporting(true);
    try {
      // Dynamic import keeps the CSV utility out of the initial bundle
      const { exportTasksToCSV } = await import("./utils/exportTasksToCSV");
      const filename = typeof id === "string" ? `tasks-${id}` : "tasks";
      exportTasksToCSV(tasksData.tasks, filename);
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleSelected = (taskId: string, selected: boolean) => {
    setSelectedTaskIds((current) => {
      const next = new Set(current);

      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }

      return next;
    });
  };

  const openGithubConfirm = (tasks: Task[]) => {
    if (!isGithubAvailable) {
      toast.error(
        reposError
          ? "Connect GitHub before exporting issues."
          : "No GitHub repositories are available.",
      );
      return;
    }

    if (!tasks.length) {
      toast.error("Select at least one task to export.");
      return;
    }

    setPendingGithubTasks(tasks);
    setExportResult(null);
    setExportProgress("");
    setIsConfirmOpen(true);
  };

  const handleConfirmGithubExport = async () => {
    if (!selectedRepository || !pendingGithubTasks.length) return;

    setIsGithubExporting(true);
    setExportProgress(
      `Creating ${pendingGithubTasks.length} GitHub issue${
        pendingGithubTasks.length !== 1 ? "s" : ""
      }...`,
    );

    try {
      const res = await axios.post(DOC_ROUTES.API.GITHUB.ISSUES_EXPORT, {
        repository: selectedRepository,
        tasks: pendingGithubTasks,
      });

      const result: ExportResult = {
        total: pendingGithubTasks.length,
        createdIssues: res.data.createdIssues || [],
        failedIssues: res.data.failedIssues || [],
      };

      setExportResult(result);
      setSelectedTaskIds((current) => {
        const next = new Set(current);
        result.createdIssues.forEach((issue) => next.delete(issue.taskId));
        return next;
      });
      setExportProgress("Export complete.");

      if (result.failedIssues.length > 0) {
        toast.error("Some GitHub issues failed to export.");
      } else {
        toast.success("GitHub issues created successfully.");
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : err instanceof Error
            ? err.message
            : "Failed to export GitHub issues";

      setExportProgress("");
      toast.error(message);
    } finally {
      setIsGithubExporting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border/60"></div>
            <Sparkles className="w-4 h-4 text-muted-foreground/60" />
            <div className="h-px flex-1 bg-border/60"></div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4 mb-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-8 w-8 border-border/60 hover:border-border bg-card/50 transition-all duration-300"
                onClick={() => router.push(`/generate/${id}`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl flex items-center justify-center gap-3">
              <ListTodo className="h-10 w-10 text-primary" />
              Task Breakdown
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Comprehensive task list for your system architecture, organized by
              category and priority.
            </p>

            <div className="flex justify-center gap-12 pt-4">
              <div className="text-center">
                <p className="text-3xl font-bold tracking-tight">
                  {totalTasks}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  Total Tasks
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold tracking-tight">
                  {totalHours}h
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  Est. Hours
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold tracking-tight text-destructive">
                  {highPriorityCount}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  High Priority
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
            <Select
              value={selectedRepository}
              onValueChange={setSelectedRepository}
              disabled={!isGithubAvailable || isGithubExporting}
            >
              <SelectTrigger className="w-full max-w-xs bg-card/50">
                <SelectValue
                  placeholder={
                    reposLoading
                      ? "Loading repositories..."
                      : reposError
                        ? "GitHub not connected"
                        : "Select GitHub repository"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {repos.map((repo) => (
                  <SelectItem key={repo.id} value={repo.full_name}>
                    {repo.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleDownloadCSV}
              disabled={!tasksData || isExporting}
              className="h-10 px-8 rounded-xl border-border/60 hover:border-border bg-card/50 transition-all duration-300 shadow-sm cursor-pointer"
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2 text-muted-foreground" />
                  Download CSV Breakdown
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => openGithubConfirm(selectedTasks)}
              disabled={
                !isGithubAvailable ||
                selectedTasks.length === 0 ||
                isGithubExporting
              }
              className="h-10 px-8 rounded-xl border-border/60 hover:border-border bg-card/50 transition-all duration-300 shadow-sm cursor-pointer"
            >
              <Github className="h-4 w-4 mr-2 text-muted-foreground" />
              Export Selected to GitHub
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {selectedTasks.length} selected for GitHub export
          </p>
          {reposError && (
            <p className="text-center text-xs text-destructive">
              GitHub export is available after connecting a GitHub account.
            </p>
          )}
        </div>

        {exportResult && (
          <Alert>
            <Github className="h-4 w-4" />
            <AlertTitle>
              {exportResult.createdIssues.length} Issues Created
            </AlertTitle>
            <AlertDescription>
              <p>
                Total selected: {exportResult.total}. Failed issues:{" "}
                {exportResult.failedIssues.length}.
              </p>
              {exportResult.createdIssues.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="font-medium text-foreground">Created Issues:</p>
                  {exportResult.createdIssues.map((issue) => (
                    <a
                      key={issue.url}
                      href={issue.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      #{issue.number} {issue.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              )}
              {exportResult.failedIssues.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="font-medium text-destructive">Failed Issues:</p>
                  {exportResult.failedIssues.map((issue) => (
                    <p key={issue.taskId}>
                      {issue.title}: {issue.error}
                    </p>
                  ))}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-16 pt-12">
          {Object.entries(tasksByCategory).map(([category, tasks], index) => (
            <TasksSection
              key={category}
              category={category}
              tasks={tasks}
              allTasks={tasksData.tasks}
              sectionIndex={index + 1}
              selectedTaskIds={selectedTaskIds}
              onToggleSelected={handleToggleSelected}
              onCreateGithubIssue={(task) => openGithubConfirm([task])}
              isGithubExporting={isGithubExporting}
              isGithubAvailable={isGithubAvailable}
            />
          ))}
        </div>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export GitHub Issues</DialogTitle>
            <DialogDescription>
              Confirm the repository and number of tasks before creating GitHub
              Issues.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Repository</p>
              <Select
                value={selectedRepository}
                onValueChange={setSelectedRepository}
                disabled={isGithubExporting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select GitHub repository" />
                </SelectTrigger>
                <SelectContent>
                  {repos.map((repo) => (
                    <SelectItem key={repo.id} value={repo.full_name}>
                      {repo.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border border-border/60 p-3 text-sm">
              <p>
                Selected repository:{" "}
                <span className="font-medium">
                  {selectedRepository || "None selected"}
                </span>
              </p>
              <p>
                Tasks being exported:{" "}
                <span className="font-medium">{pendingGithubTasks.length}</span>
              </p>
            </div>

            {exportProgress && (
              <p className="text-sm text-muted-foreground">{exportProgress}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isGithubExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmGithubExport}
              disabled={
                !selectedRepository ||
                pendingGithubTasks.length === 0 ||
                isGithubExporting
              }
            >
              {isGithubExporting ? "Creating..." : "Create Issues"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
