"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, GitBranch, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GithubBranch } from "../hooks/useGithubBranches";

interface GitBranchSelectProps {
  branches: GithubBranch[];
  selectedBranch: string;
  defaultBranch?: string;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (branch: string) => void;
  className?: string;
}

export function GitBranchSelect({
  branches,
  selectedBranch,
  defaultBranch,
  loading = false,
  disabled = false,
  onSelect,
  className,
}: GitBranchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? branches.filter((b) => b.name.toLowerCase().includes(q))
      : branches;
    return [...list].sort((a, b) => {
      if (a.name === selectedBranch || a.name === defaultBranch) return -1;
      if (b.name === selectedBranch || b.name === defaultBranch) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [branches, query, selectedBranch, defaultBranch]);

  const closeMenu = () => {
    setOpen(false);
    setQuery("");
  };

  const openMenu = () => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (branch: string) => {
    onSelect(branch);
    closeMenu();
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        className={cn(
          "h-8 py-0 px-3 border border-[#d0d7de] bg-white text-[#1f2328]",
          "hover:bg-[#f3f4f6] hover:text-[#1f2328] focus-visible:ring-2 focus-visible:ring-[#0969da]",
          "focus-visible:ring-offset-1 cursor-pointer",
          open && "bg-[#f3f4f6]",
        )}
      >
        <GitBranch className="size-4 text-[#656d76]" strokeWidth={2} />
        <span className="max-w-45 truncate">{selectedBranch || "—"}</span>
        <ChevronDown className="size-3.5 text-[#656d76]" strokeWidth={2.5} />
      </Button>

      {open && (
        <div
          className={cn(
            "absolute left-0 mt-1 z-50 w-80",
            "bg-white border border-[#d0d7de] rounded-md shadow-lg overflow-hidden",
          )}
        >
          <div className="px-3 py-2 border-b border-[#d0d7de] bg-[#f6f8fa]">
            <p className="text-sm font-semibold text-[#1f2328]">
              Switch branches
            </p>
          </div>

          <div className="p-2 border-b border-[#d0d7de]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#656d76]" />
              <Input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a branch..."
                className={cn(
                  "h-7 pl-7 pr-2 text-sm rounded-md shadow-none",
                  "border border-[#d0d7de] bg-white text-[#1f2328]",
                  "placeholder:text-[#656d76]",
                  "focus-visible:border-[#0969da] focus-visible:ring-[#0969da]/30 focus-visible:ring-2",
                )}
              />
            </div>
          </div>

          <div className="max-h-65 overflow-y-auto" role="listbox">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-[#656d76] text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading branches...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[#656d76] text-center">
                Nothing to show
              </div>
            ) : (
              filtered.map((branch) => {
                const isSelected = branch.name === selectedBranch;
                const isDefault = branch.name === defaultBranch;
                return (
                  <Button
                    key={branch.name}
                    type="button"
                    variant="ghost"
                    onClick={() => handleSelect(branch.name)}
                    className={cn(
                      "group w-full justify-start h-auto py-1.5 px-3 rounded-none transition-none",
                      "font-normal cursor-pointer border-b border-[#eaeef2] last:border-b-0",
                      "text-[#1f2328] hover:bg-[#0969da] hover:text-white text-left",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                      strokeWidth={2.5}
                    />
                    <span className="truncate flex-1">{branch.name}</span>
                    {isDefault && (
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full border shrink-0",
                          "border-[#d0d7de] text-[#656d76]",
                          "group-hover:border-white/50 group-hover:text-white",
                        )}
                      >
                        default
                      </span>
                    )}
                  </Button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
