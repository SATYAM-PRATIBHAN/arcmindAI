"use client";

import { FileBrowser } from "./file-browser";
import { Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useGithubToken } from "../hooks/useGithubToken";
import { useRepositoryAnalyzer } from "../hooks/useRepositoryAnalyzer";
import { useGithubDesignGenerator } from "../hooks/useGithubDesignGenerator";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MermaidViewer } from "./mermaid-viewer";
import { DOC_ROUTES } from "@/lib/routes";

export function RepositoryPageClient() {
  const router = useRouter();
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

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

  // Track if generation has been triggered to prevent duplicate calls
  const generationTriggeredRef = useRef(false);

  const handleUpdateClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmUpdate = () => {
    if (generationId) {
      router.push(DOC_ROUTES.IMPORT.UPDATE(generationId));
    } else {
      toast.error(
        "No generation ID available. Please generate a design first."
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
    await analyze(owner, repo);
  }

  // Step 2: Generate design when analysis completes
  useEffect(() => {
    if (analysis && !mermaidDiagram && !generationTriggeredRef.current) {
      generationTriggeredRef.current = true; // Mark as triggered
      const runGeneration = async () => {
        toast.info("Generating system design...");
        await generateDesign(owner, repo, analysis);
      };
      runGeneration();
    }
  }, [analysis, mermaidDiagram, owner, repo, generateDesign]);

  // Handle errors
  useEffect(() => {
    if (analyzeError) {
      toast.error(`Analysis failed: ${analyzeError}`);
    }
  }, [analyzeError]);

  useEffect(() => {
    if (generateError) {
      toast.error(`Design generation failed: ${generateError}`);
    }
  }, [generateError]);

  // Success notification
  useEffect(() => {
    if (mermaidDiagram) {
      toast.success("System design generated successfully!");
    }
  }, [mermaidDiagram]);

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

  return (
    <div className="flex flex-col gap-10 justify-center px-4 md:px-20 py-10 py-28 lg:py-42 ">
      <FileBrowser />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-2">
          <Button
            className="w-fit cursor-pointer"
            onClick={handleGenerateDesign}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {analyzing ? "Analyzing Repository..." : "Generating Design..."}
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

        {mermaidDiagram && (
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
            <Button variant="outline" onClick={handleCancelUpdate}>
              Cancel
            </Button>
            <Button onClick={handleConfirmUpdate}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
