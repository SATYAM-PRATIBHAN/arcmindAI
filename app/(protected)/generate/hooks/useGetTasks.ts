import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

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

interface TasksResponse {
  success: boolean;
  tasks: TasksData;
  fromCache: boolean;
  message?: string;
}

export function useGetTasks() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = (session?.user as { accessToken?: string })?.accessToken;

  const getTasks = useCallback(
    async (generationId: string): Promise<TasksResponse | null> => {
      if (!accessToken) {
        setError("No access token available. Please log in.");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `/api/generate/${generationId}/tasks`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.status < 200 || response.status >= 300) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: TasksResponse = response.data;
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken],
  );

  return {
    getTasks,
    isLoading,
    error,
  };
}
