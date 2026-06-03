"use client";

import { DOC_ROUTES } from "@/lib/routes";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface GithubBranch {
  name: string;
  commit: { sha: string; url: string };
  protected: boolean;
}

export function useGithubBranches(owner: string, repo: string) {
  const [branches, setBranches] = useState<GithubBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get(DOC_ROUTES.API.GITHUB.REPO_BRANCH, {
          params: { owner, repo },
        });

        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to fetch branches");
        }

        setBranches(res.data.branches);
      } catch (err) {
        console.error(err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast.error(`Failed to load branches: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [owner, repo]);

  return { branches, loading, error };
}
