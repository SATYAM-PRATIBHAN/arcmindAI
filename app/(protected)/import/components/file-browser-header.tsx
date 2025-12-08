"use client";

import { Home, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DOC_ROUTES } from "@/lib/routes";

interface FileBrowserHeaderProps {
  owner: string;
  repo: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function FileBrowserHeader({
  owner,
  repo,
  sidebarOpen,
  onToggleSidebar,
}: FileBrowserHeaderProps) {
  const router = useRouter();
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(DOC_ROUTES.IMPORT.ROOT)}
            className="cursor-pointer"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Repositories
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          {sidebarOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>
      </div>

      <h1 className="text-xl md:text-3xl font-bold">
        {owner}/{repo}
      </h1>
    </>
  );
}
