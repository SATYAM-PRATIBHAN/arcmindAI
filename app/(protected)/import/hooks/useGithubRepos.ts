"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import { DOC_ROUTES } from "@/lib/routes";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
}

export function useGithubRepos() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        // Use secure proxy endpoint instead of direct GitHub API call
        const res = await axios.get(DOC_ROUTES.API.GITHUB.REPOS);

        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch repositories");
        }

        setRepos(res.data.repos);
      } catch (error) {
        console.error(error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to load repositories: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  return { repos, loading };
}
