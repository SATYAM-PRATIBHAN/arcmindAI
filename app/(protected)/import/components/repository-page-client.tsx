"use client";

import animationData from "@/components/loaderLottie.json";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DOC_ROUTES } from "@/lib/routes";
import Lottie from "lottie-react";
import { Loader2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useGithubDesignGenerator } from "../hooks/useGithubDesignGenerator";
import { useGithubToken } from "../hooks/useGithubToken";
import { useRepositoryAnalyzer } from "../hooks/useRepositoryAnalyzer";
import { FileBrowser } from "./file-browser";
import { MermaidViewer } from "./mermaid-viewer";

export function RepositoryPageClient() {
  const router = useRouter();
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const searchParams = useSearchParams();
  const branch = searchParams.get("branch") ?? undefined;

  const { isConnected, loading } = useGithubToken();
  const {
    analyze,
    analysis,
    loading: analyzing,
    error: analyzeError,
  } = useRepositoryAnalyzer();
  const {
    generateDesign,
    mermaidDiagram,
    generationId,
    loading: generating,
    error: generateError,
  } = useGithubDesignGenerator();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Track if generation has been triggered to prevent duplicate calls
  const generationTriggeredRef = useRef(false);

  // Auto-scroll terminal during streaming
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [mermaidDiagram]);

  const getPipelineStage = (progressLength: number) => {
    if (progressLength === 0) return 0; // Schema Ingestion
    if (progressLength > 0 && progressLength < 300) return 1; // Entity Clustering
    return 2; // Infrastructure Compilation
  };

  const currentStage = getPipelineStage(mermaidDiagram?.length || 0);

  const handleUpdateClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmUpdate = () => {
    if (generationId) {
      router.push(DOC_ROUTES.IMPORT.UPDATE(generationId));
    } else {
      toast.error(
        "No generation ID available. Please generate a design first.",
      );
    }
    setIsDialogOpen(false);
  };

  const handleCancelUpdate = () => {
    setIsDialogOpen(false);
  };

  useEffect(() => {
    if (!loading && !isConnected) {
      router.push(DOC_ROUTES.IMPORT.ROOT);
    }
  }, [loading, isConnected, router]);

  async function handleGenerateDesign() {
    if (!isConnected) {
      toast.error("GitHub not connected");
      return;
    }

    // Reset the generation trigger flag for new generation
    generationTriggeredRef.current = false;

    // Step 1: Analyze repository
    toast.info("Analyzing repository...");
    await analyze(owner, repo, branch);
  }

  // Step 2: Generate design when analysis completes
  useEffect(() => {
    if (analysis && !mermaidDiagram && !generationTriggeredRef.current) {
      generationTriggeredRef.current = true; // Mark as triggered
      const runGeneration = async () => {
        toast.info("Generating system design...");
        await generateDesign(owner, repo, analysis, branch);
      };
      runGeneration();
    }
  }, [analysis, mermaidDiagram, owner, repo, branch, generateDesign]);

  // Handle errors
  useEffect(() => {
    if (analyzeError) {
      toast.error(`Analysis failed: ${analyzeError}`);
    }
  }, [analyzeError]);

  // Handle warnings
  useEffect(() => {
    if (analysis?.warnings && analysis.warnings.length > 0) {
      analysis.warnings.forEach((warning) => {
        toast.warning(warning, { duration: 10000 });
      });
    }
  }, [analysis]);

  useEffect(() => {
    if (generateError) {
      toast.error(`Design generation failed: ${generateError}`);
    }
  }, [generateError]);

  // Success notification
  useEffect(() => {
    if (mermaidDiagram && !generating) {
      toast.success("System design generated successfully!");
    }
  }, [mermaidDiagram, generating]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConnected) {
    return null; // Will redirect via useEffect
  }

  const isGenerating = analyzing || generating;
  const showStreamingUI = generating && mermaidDiagram;

  return (
    <div className="flex flex-col gap-10 justify-center px-4 md:px-20 py-10 py-28 lg:py-42 ">
      {!showStreamingUI && <FileBrowser />}

      <div className="flex flex-col gap-6">
        {!showStreamingUI && (
          <div className="flex flex-col md:flex-row gap-2">
            <Button
              className="w-fit cursor-pointer"
              onClick={handleGenerateDesign}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {analyzing
                    ? "Analyzing Repository..."
                    : "Generating Design..."}
                </>
              ) : (
                "Generate System Design"
              )}
            </Button>
            <Button
              className="w-fit cursor-pointer"
              disabled={isGenerating || !generationId}
              onClick={handleUpdateClick}
            >
              Update System Design
            </Button>
          </div>
        )}

        {showStreamingUI && (
          <div className="w-full max-w-5xl mx-auto py-8 animate-in fade-in duration-700">
            {/* Upper Section: Formal Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 mb-8 border-b border-border/60 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                    GitHub Design Protocol
                  </p>
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Analyzing & Mapping Repository
                </h2>
              </div>

              {/* Enterprise Status Metadata */}
              <div className="flex items-center gap-6 font-mono text-[11px] text-muted-foreground/70">
                <div className="hidden sm:block">
                  <span className="text-muted-foreground/40 block text-[9px] uppercase tracking-wider">
                    Source
                  </span>
                  <span className="font-medium text-foreground">
                    {owner}/{repo}
                  </span>
                </div>
                <div className="h-6 w-px bg-border/60"></div>
                <div>
                  <span className="text-muted-foreground/40 block text-[9px] uppercase tracking-wider">
                    Status
                  </span>
                  <span className="font-medium text-foreground animate-pulse">
                    Live Stream
                  </span>
                </div>
              </div>
            </div>

            {/* Main Architectural Body Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 border border-border/80 rounded-lg overflow-hidden bg-card/10 shadow-sm">
              {/* Left Column: Dynamic Progress Sidebar */}
              <div className="p-8 flex flex-col justify-between bg-muted/20 md:border-r border-border/60">
                <div className="space-y-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Analysis Stages
                  </h3>

                  <nav className="space-y-4 font-mono text-xs">
                    <div
                      className={`flex items-center gap-3 transition-colors duration-300 ${currentStage === 0 ? "text-foreground font-medium" : currentStage > 0 ? "text-muted-foreground/50" : "text-muted-foreground/30"}`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold transition-all ${currentStage > 0 ? "bg-primary/5 border-primary/30 text-primary" : "bg-background border-primary/60 animate-pulse"}`}
                      >
                        {currentStage > 0 ? "✓" : "→"}
                      </div>
                      <span>01. Structure Ingestion</span>
                    </div>

                    <div
                      className={`flex items-center gap-3 transition-colors duration-300 ${currentStage === 1 ? "text-foreground font-medium" : currentStage > 1 ? "text-muted-foreground/50" : "text-muted-foreground/30"}`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold transition-all ${currentStage > 1 ? "bg-primary/5 border-primary/30 text-primary" : currentStage === 1 ? "bg-background border-primary/60 animate-pulse text-primary" : "border-border bg-background/50"}`}
                      >
                        {currentStage > 1 ? "✓" : currentStage === 1 ? "→" : ""}
                      </div>
                      <span>02. Module Clustering</span>
                    </div>

                    <div
                      className={`flex items-center gap-3 transition-colors duration-300 ${currentStage === 2 ? "text-foreground font-medium" : "text-muted-foreground/30"}`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold transition-all ${currentStage === 2 ? "bg-primary/5 border-primary/30 text-primary" : "border-dashed border-border bg-background/50"}`}
                      >
                        {currentStage === 2 ? "→" : ""}
                      </div>
                      <span>03. Visual Synthesis</span>
                    </div>
                  </nav>
                </div>

                <div className="pt-8 mt-8 border-t border-border/40 hidden md:flex items-center gap-4">
                  <div className="opacity-40 scale-75 origin-left mix-blend-luminosity">
                    <Lottie
                      animationData={animationData}
                      loop={true}
                      style={{ width: 50, height: 50 }}
                    />
                  </div>
                </div>
              </div>

              {/* Premium Dark Right Column */}
              <div className="md:col-span-2 bg-zinc-950 p-8 flex flex-col justify-between min-h-[400px] text-zinc-100">
                <div className="relative flex-1">
                  <div
                    ref={terminalRef}
                    className="absolute inset-0 overflow-y-auto font-mono text-[11px] leading-6 scrollbar-none select-text"
                  >
                    <div className="text-zinc-500 text-[10px] uppercase tracking-wider select-none pb-3 border-b border-zinc-900/80 mb-4 flex items-center justify-between">
                      <span>{"//"} github_analysis_engine.log</span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] lowercase animate-pulse">
                        live compile
                      </span>
                    </div>

                    <div className="space-y-1 font-mono tracking-normal text-zinc-300">
                      {mermaidDiagram.split("\n").map((line, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 hover:bg-zinc-900/40 px-2 py-0.5 rounded transition-colors group"
                        >
                          <span className="text-zinc-700 text-right select-none w-5 text-[10px] pt-0.5 font-light">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <p className="flex-1 whitespace-pre-wrap break-all">
                            {line}
                          </p>
                        </div>
                      ))}
                      <div className="flex items-start gap-4 px-2 pt-0.5">
                        <span className="text-zinc-700 select-none w-5 text-[10px] font-light">
                          {String(
                            mermaidDiagram.split("\n").filter(Boolean).length +
                              1,
                          ).padStart(2, "0")}
                        </span>
                        <span className="inline-block w-1.5 h-4 bg-primary/80 animate-pulse opacity-90 align-middle" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mermaidDiagram && !generating && (
          <MermaidViewer
            diagram={mermaidDiagram}
            title={`${owner}/${repo} - System Architecture`}
          />
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update System Design</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the system design? This will take
              you to the update page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelUpdate}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmUpdate} className="cursor-pointer">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
