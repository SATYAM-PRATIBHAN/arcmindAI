"use client";

import { GithubConnect } from "./github-connect";
import { RepoList } from "./repo-list";
import { Loader2 } from "lucide-react";
import { useGithubToken } from "../hooks/useGithubToken";

export function ImportPageClient() {
  const { isConnected, loading } = useGithubToken();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return <GithubConnect />;
  }

  return (
    <div className="container mx-auto py-28 lg:py-42 px-4">
      <RepoList />
    </div>
  );
}
