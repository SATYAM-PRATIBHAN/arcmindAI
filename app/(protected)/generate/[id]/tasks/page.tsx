"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ListTodo, Download, Sparkles } from "lucide-react";
import Lottie from "lottie-react";
import animationData from "@/components/loaderLottie.json";

import { useGetTasks } from "../../hooks/useGetTasks";
import TasksSection from "./components/TasksSection";

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

export default function TasksPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getTasks, isLoading, error } = useGetTasks();

  const [tasksData, setTasksData] = useState<TasksData | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

          <div className="flex justify-center pt-2">
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
          </div>
        </div>

        <div className="grid grid-cols-1 gap-16 pt-12">
          {Object.entries(tasksByCategory).map(([category, tasks], index) => (
            <TasksSection
              key={category}
              category={category}
              tasks={tasks}
              allTasks={tasksData.tasks}
              sectionIndex={index + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
