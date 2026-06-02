"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Download, Info, Sparkles } from "lucide-react";
import { useGetGenerationById } from "../hooks/useGetGenerationById";
import { useDeleteGenerationById } from "../hooks/useDeleteGenerationById";
import { useUpdateGeneration } from "@/hooks/useUpdateGeneration";
import { useHistory } from "@/lib/contexts/HistoryContext";
import { DiagramProvider, useDiagram } from "@/lib/contexts/DiagramContext";
import { downloadMarkdownFile } from "../utils/generate-markdown";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  MermaidDiagram,
  D3Canvas,
  CopyDiagramButton,
  ExportPDFButton,
  MicroservicesSection,
  EntitiesSection,
  ApiRoutesSection,
  DatabaseSchemaSection,
  InfrastructureSection,
  ActionDialog,
  UpdateResponseCard,
  AskDoubtCard,
  ActionButton,
  DeleteDialog,
  FrontendStructureDialog,
  TaskGenerationDialog,
} from "../components";

import Lottie from "lottie-react";
import animationData from "@/components/loaderLottie.json";
import { DOC_ROUTES } from "@/lib/routes";
import { ArchitectureData } from "../utils/types";
import { cleanMermaidString } from "../utils/cleanMermaidString";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
// wrapped around a function to better organize the code and separate the provider logic from the page content
function GenerationPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const { getGenerationById, isLoading, error } = useGetGenerationById();
  const { isD3Enabled, setIsD3Enabled } = useDiagram();
  const {
    deleteGeneration,
    isLoading: isDeleting,
    error: deleteError,
  } = useDeleteGenerationById();
  const {
    updateGeneration,
    isLoading: isUpdating,
    error: updateError,
  } = useUpdateGeneration();
  const { refetch } = useHistory();

  const [generatedData, setGeneratedData] = useState<ArchitectureData | null>(
    null,
  );
  const [githubGeneration, setGithubGeneration] = useState<string | null>(null);
  const [systemName, setSystemName] = useState<string>("");
  const [isGithubRepo, setIsGithubRepo] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isFrontendStructureDialogOpen, setIsFrontendStructureDialogOpen] =
    useState(false);
  const [isTaskGenerationDialogOpen, setIsTaskGenerationDialogOpen] =
    useState(false);
  const [selectedAction, setSelectedAction] = useState<
    "update" | "doubt" | null
  >(null);
  const [isDoubtChatOpen, setIsDoubtChatOpen] = useState(false);

  const [responseText, setResponseText] = useState("");
  const [doubtText, setDoubtText] = useState("");
  const mermaidContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        if (id && typeof id === "string") {
          const result = await getGenerationById(id);
          if (result && result.success) {
            setSystemName(result.output.userInput || "");
            if (result.output.githubGeneration) {
              setGithubGeneration(result.output.githubGeneration);
              setIsGithubRepo(true);
              setGeneratedData(null);
            } else {
              try {
                const data = result.output.generatedOutput as ArchitectureData;
                setGeneratedData(data);
                setIsGithubRepo(false);
                setGithubGeneration(null);
              } catch (error) {
                console.error("Error processing generation data:", error);
                setGeneratedData(null);
              }
            }
          } else {
            setGeneratedData(null);
            setGithubGeneration(null);
          }
        }
      })();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [getGenerationById, id]);

  const handleUpdate = async () => {
    if (!id || typeof id !== "string" || !responseText.trim()) return;

    if (isGithubRepo) {
      toast.info(
        "Updates are not yet supported for GitHub repository designs.",
      );
      return;
    }

    const result = await updateGeneration(id, responseText);
    if (result && result.success) {
      // @ts-expect-error output is the updated generation object
      const data = result.output.generatedOutput as ArchitectureData;
      setGeneratedData(data);
      toast.success("Generation updated successfully");
      refetch();
      setResponseText("");
      setIsActionDialogOpen(false);
    } else {
      console.error("Failed to update generation:", updateError);
      toast.error(updateError || "Failed to update generation");
    }
  };

  const handleDelete = async () => {
    if (!id || typeof id !== "string") return;

    const result = await deleteGeneration(id);
    if (result && result.success) {
      toast.success("Generation deleted successfully");
      refetch();
      router.push(DOC_ROUTES.GENERATE);
    } else {
      toast.error(deleteError || "Failed to delete generation");
    }
  };

  const handleShare = async () => {
    if (!id || typeof id !== "string") return;

    try {
      const response = await fetch(`/api/generate/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        const shareUrl = `${window.location.origin}/share/${data.shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard!");
      } else {
        toast.error(data.message || "Failed to share generation");
      }
    } catch (error) {
      console.error("Share failed:", error);
      toast.error("An error occurred while sharing");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Lottie
          animationData={animationData}
          loop
          style={{ width: 400, height: 400 }}
        />
      </div>
    );
  }

  if (error || (!generatedData && !githubGeneration)) {
    return (
      <div className="container mx-auto p-6">
        <Card
          className={
            error
              ? "border-red-200 bg-red-50"
              : "border-yellow-200 bg-yellow-50"
          }
        >
          <CardContent className="pt-4">
            <p className={error ? "text-red-800" : "text-yellow-800"}>
              {error
                ? `Error: ${error}`
                : "Generation not found or failed to load."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── GitHub generation view ──────────────────────────────────────────────
  if (isGithubRepo && githubGeneration) {
    const cleanedGithubDiagram = cleanMermaidString(githubGeneration);

    // Create a minimal ArchitectureData object for components that expect it (like ExportPDFButton)
    const githubData: ArchitectureData = {
      systemName: systemName || "GitHub Repository Design",
      summary: "System architecture generated from GitHub repository analysis",
      microservices: [],
      entities: [],
      apiRoutes: [],
      databaseSchema: { type: "N/A", collections: [] },
      infrastructure: {
        hosting: "N/A",
        database: "N/A",
        auth: "N/A",
        cdn: "N/A",
        scaling: "N/A",
      },
      "Architecture Diagram": githubGeneration,
    };

    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ActionDialog
          open={isActionDialogOpen}
          onOpenChange={setIsActionDialogOpen}
          onSelectUpdate={() => {
            router.push(DOC_ROUTES.IMPORT.UPDATE(id as string));
            setIsActionDialogOpen(false);
          }}
          onSelectDoubt={() => {
            setSelectedAction("doubt");
            setIsDoubtChatOpen(true);
            setIsActionDialogOpen(false);
          }}
          onCancel={() => {
            setSelectedAction(null);
            setIsActionDialogOpen(false);
          }}
        />

        <AskDoubtCard
          open={isDoubtChatOpen}
          onOpenChange={setIsDoubtChatOpen}
          doubtText={doubtText}
          onDoubtTextChange={setDoubtText}
          generationId={id as string}
        />

        <ActionButton onClick={() => setIsActionDialogOpen(true)} />

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-border/60"></div>
              <Sparkles className="w-4 h-4 text-muted-foreground/60" />
              <div className="h-px flex-1 bg-border/60"></div>
            </div>

            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {systemName || "GitHub Repository Design"}
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                System architecture generated from GitHub repository analysis
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <ExportPDFButton
                data={githubData}
                diagramRef={mermaidContainerRef}
                variant="default"
                size="lg"
                className="rounded-2xl px-8"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 px-6 cursor-pointer rounded-xl border-border/60 hover:border-border bg-card/50 transition-all duration-300"
                      onClick={handleShare}
                    >
                      <Info className="mr-2 h-4 w-4 text-muted-foreground" />
                      Share
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy public share link to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="outline"
                className="h-10 px-6 rounded-xl border-border/60 hover:border-border bg-card/50 transition-all duration-300 shadow-sm"
                onClick={() =>
                  downloadMarkdownFile(githubGeneration, systemName)
                }
              >
                <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                Export Markdown
              </Button>
              <DeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-20 pt-12">
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    01
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Architecture Visual
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl border border-border/30">
                    <Button
                      variant={isD3Enabled ? "default" : "ghost"}
                      size="sm"
                      className="rounded-lg h-8 text-[11px] font-medium cursor-pointer"
                      onClick={() => setIsD3Enabled(true)}
                    >
                      Interactive (D3)
                    </Button>
                    <Button
                      variant={!isD3Enabled ? "default" : "ghost"}
                      size="sm"
                      className="rounded-lg h-8 text-[11px] font-medium cursor-pointer"
                      onClick={() => setIsD3Enabled(false)}
                    >
                      Static (Mermaid)
                    </Button>
                  </div>
                  <CopyDiagramButton code={cleanedGithubDiagram} />
                </div>
              </div>
              {isD3Enabled ? (
                <D3Canvas chart={cleanedGithubDiagram} />
              ) : (
                <div
                  ref={mermaidContainerRef}
                  className="rounded-2xl border border-border/40 bg-card/30 p-8 overflow-hidden backdrop-blur-sm shadow-inner"
                >
                  <MermaidDiagram chart={cleanedGithubDiagram} />
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  // ── Regular generation view ─────────────────────────────────────────────
  if (!generatedData) return null;

  const cleanedDiagram = cleanMermaidString(
    generatedData["Architecture Diagram"],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <ActionDialog
        open={isActionDialogOpen}
        onOpenChange={setIsActionDialogOpen}
        onSelectUpdate={() => {
          setSelectedAction("update");
          setIsActionDialogOpen(false);
        }}
        onSelectDoubt={() => {
          setSelectedAction("doubt");
          setIsDoubtChatOpen(true);
          setIsActionDialogOpen(false);
        }}
        onCancel={() => {
          setSelectedAction(null);
          setIsActionDialogOpen(false);
        }}
      />

      {selectedAction === "update" && (
        <UpdateResponseCard
          responseText={responseText}
          onResponseTextChange={setResponseText}
          onUpdate={handleUpdate}
          isUpdating={isUpdating}
          error={updateError}
        />
      )}

      <AskDoubtCard
        open={isDoubtChatOpen}
        onOpenChange={setIsDoubtChatOpen}
        doubtText={doubtText}
        onDoubtTextChange={setDoubtText}
        generationId={id as string}
      />

      <FrontendStructureDialog
        open={isFrontendStructureDialogOpen}
        onOpenChange={setIsFrontendStructureDialogOpen}
        generationId={id as string}
      />

      <TaskGenerationDialog
        open={isTaskGenerationDialogOpen}
        onOpenChange={setIsTaskGenerationDialogOpen}
        generationId={id as string}
      />

      <ActionButton onClick={() => setIsActionDialogOpen(true)} />

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border/60"></div>
            <Sparkles className="w-4 h-4 text-muted-foreground/60" />
            <div className="h-px flex-1 bg-border/60"></div>
          </div>

          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {generatedData.systemName || "System Architecture"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {generatedData.summary || "No summary available."}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <ExportPDFButton
              data={generatedData}
              diagramRef={mermaidContainerRef}
              variant="default"
              size="lg"
              className="rounded-2xl px-8"
            />
            <Button
              variant="outline"
              className="h-10 px-6 rounded-xl border-border/60 hover:border-border bg-card/50 transition-all duration-300 shadow-sm"
              onClick={() => setIsFrontendStructureDialogOpen(true)}
            >
              <Code2 className="mr-2 h-4 w-4 text-muted-foreground" />
              Frontend Structure
            </Button>
            <Button
              variant="outline"
              className="h-10 px-6 rounded-xl border-border/60 hover:border-border bg-card/50 transition-all duration-300 shadow-sm"
              onClick={() => setIsTaskGenerationDialogOpen(true)}
            >
              <Code2 className="mr-2 h-4 w-4 text-muted-foreground" />
              Task Generation
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 px-6 cursor-pointer rounded-xl border-border/60 hover:border-border bg-card/50 transition-all duration-300"
                    onClick={handleShare}
                  >
                    <Info className="mr-2 h-4 w-4 text-muted-foreground" />
                    Share
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy public share link to clipboard</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              className="h-10 px-6 rounded-xl border-border/60 hover:border-border bg-card/50 transition-all duration-300 shadow-sm"
              onClick={() => downloadMarkdownFile(generatedData)}
            >
              <Download className="mr-2 h-4 w-4 text-muted-foreground" />
              Export Markdown
            </Button>
            <DeleteDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-20 pt-12">
          {/* Sections */}
          {generatedData.microservices && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  01
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Microservices
                </h2>
              </div>
              <MicroservicesSection
                microservices={generatedData.microservices}
              />
            </section>
          )}

          {generatedData.entities && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  02
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Core Entities
                </h2>
              </div>
              <EntitiesSection entities={generatedData.entities} />
            </section>
          )}

          {generatedData.apiRoutes && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  03
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  API Infrastructure
                </h2>
              </div>
              <ApiRoutesSection apiRoutes={generatedData.apiRoutes} />
            </section>
          )}

          {generatedData.databaseSchema && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  04
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Database Architecture
                </h2>
              </div>
              <DatabaseSchemaSection schema={generatedData.databaseSchema} />
            </section>
          )}

          {generatedData.infrastructure && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  05
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Deployment & Infra
                </h2>
              </div>
              <InfrastructureSection infra={generatedData.infrastructure} />
            </section>
          )}

          {generatedData["Architecture Diagram"] && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    06
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Architecture Visual
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl border border-border/30">
                    <Button
                      variant={isD3Enabled ? "default" : "ghost"}
                      size="sm"
                      className="rounded-lg h-8 text-[11px] font-medium cursor-pointer"
                      onClick={() => setIsD3Enabled(true)}
                    >
                      Interactive (D3)
                    </Button>
                    <Button
                      variant={!isD3Enabled ? "default" : "ghost"}
                      size="sm"
                      className="rounded-lg h-8 text-[11px] font-medium cursor-pointer"
                      onClick={() => setIsD3Enabled(false)}
                    >
                      Static (Mermaid)
                    </Button>
                  </div>
                  <CopyDiagramButton code={cleanedDiagram} />
                </div>
              </div>
              {isD3Enabled ? (
                <D3Canvas chart={cleanedDiagram} />
              ) : (
                <div
                  ref={mermaidContainerRef}
                  className="rounded-2xl border border-border/40 bg-card/30 p-8 overflow-hidden backdrop-blur-sm shadow-inner"
                >
                  <MermaidDiagram chart={cleanedDiagram} />
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
// The main page component that wraps the content with the DiagramProvider to provide context to all child components.
export default function GenerationPage() {
  return (
    <DiagramProvider>
      <GenerationPageContent />
    </DiagramProvider>
  );
}
