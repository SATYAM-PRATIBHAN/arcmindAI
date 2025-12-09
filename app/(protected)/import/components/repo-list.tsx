"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { useGithubRepos } from "../hooks/useGithubRepos";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
}

export function RepoList() {
  const { repos, loading } = useGithubRepos();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const REPOS_PER_PAGE = isMobile ? 6 : 12;

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredRepos.length / REPOS_PER_PAGE);
  const startIndex = (currentPage - 1) * REPOS_PER_PAGE;
  const endIndex = startIndex + REPOS_PER_PAGE;
  const paginatedRepos = filteredRepos.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to page 1 when search changes
  };

  const handleImport = (repo: Repository) => {
    router.push(`/import/${repo.full_name}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Import Repository</h1>
        <p className="text-muted-foreground">
          Select a repository to import into ArcMind AI.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 bg-white/70"
        />
      </div>

      <div className="space-y-3 mt-4">
        {paginatedRepos.map((repo) => (
          <div
            key={repo.id}
            className="flex items-center justify-between w-full border border-black/10 hover:border-primary rounded-lg px-4 py-3 hover:bg-accent/20 transition-all group"
          >
            {/* Left Section */}
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-muted border border-black/10 flex items-center justify-center text-sm font-semibold opacity-80 group-hover:opacity-100 transition">
                {repo.name.charAt(0).toUpperCase()}
              </div>

              {/* Repo Info */}
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium truncate">{repo.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {repo.private ? "Private" : "Public"} · Updated{" "}
                  {new Date(repo.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Import Button */}
            <Button
              onClick={() => handleImport(repo)}
              size="sm"
              className="cursor-pointer flex items-center gap-1 px-2 md:px-4"
            >
              <Download className="w-4 h-4" />
              Import
            </Button>
          </div>
        ))}
      </div>

      {filteredRepos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No repositories found matching your search.
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 w-full mt-4">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 w-full justify-center">
            {/* Previous Button (icon only on small screens) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="whitespace-nowrap flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Page Numbers Scrollable */}
            <div className="flex gap-1 overflow-x-auto max-w-[80vw] px-2 scrollbar-none">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                ),
              )}
            </div>

            {/* Next Button (icon only on mobile) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="whitespace-nowrap flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Optional Compact Page Display for Mobile */}
          <p className="text-xs text-muted-foreground sm:hidden">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      )}
    </div>
  );
}
