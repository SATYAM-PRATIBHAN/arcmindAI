"use client";

import { DOC_ROUTES } from "@/lib/routes";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  description: string | null;
  updated_at: string;
}

export function useGithubRepos() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        // Use secure proxy endpoint instead of direct GitHub API call
        const res = await axios.get(DOC_ROUTES.API.GITHUB.REPOS);

        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch repositories");
        }

        setRepos(res.data.repos);
      } catch (err) {
        console.error(err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error(`Failed to load repositories: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  return { repos, loading, error };
}
