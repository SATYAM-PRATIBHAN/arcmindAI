"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ListTodo } from "lucide-react";
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
        <p className="text-lg text-gray-600 mt-4">
          {fromCache ? "Loading tasks..." : "Generating task breakdown..."}
        </p>
      </div>
    );
  }

  if (error || !tasksData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-800">
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push(`/generate/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListTodo className="h-8 w-8" />
            Task Breakdown
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive task list for your system architecture
          </p>
        </div>
      </div>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-blue-600">
                {totalTasks}
              </span>
              <span className="text-sm text-gray-600">Total Tasks</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-purple-600">
                {totalHours}h
              </span>
              <span className="text-sm text-gray-600">Estimated Hours</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-red-600">
                {highPriorityCount}
              </span>
              <span className="text-sm text-gray-600">High Priority</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks by Category */}
      {Object.entries(tasksByCategory).map(([category, tasks]) => (
        <TasksSection
          key={category}
          category={category}
          tasks={tasks}
          allTasks={tasksData.tasks}
        />
      ))}
    </div>
  );
}
