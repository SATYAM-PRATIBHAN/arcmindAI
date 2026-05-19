"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Download, Sparkles } from "lucide-react";
import { useGetGenerationById } from "../hooks/useGetGenerationById";
import { useDeleteGenerationById } from "../hooks/useDeleteGenerationById";
import { useUpdateGeneration } from "@/hooks/useUpdateGeneration";
import { useHistory } from "@/lib/contexts/HistoryContext";
import { downloadMarkdownFile } from "../utils/generate-markdown";

import {
  MermaidDiagram,
  CopyDiagramButton,
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
export default function GenerationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getGenerationById, isLoading, error } = useGetGenerationById();
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

  useEffect(() => {
    const fetchGeneration = async () => {
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
    };
    fetchGeneration();
  }, [id]);

  const handleUpdate = async () => {
    if (!id || typeof id !== "string" || !responseText.trim()) return;

    if (isGithubRepo) {
      alert("Updates are not yet supported for GitHub repository designs.");
      return;
    }

    const result = await updateGeneration(id, responseText);
    if (result && result.success) {
      const updatedResult = await getGenerationById(id);
      if (updatedResult && updatedResult.success) {
        const data = updatedResult.output.generatedOutput as ArchitectureData;
        setGeneratedData(data);
      }
      setResponseText("");
      setIsActionDialogOpen(false);
    } else {
      console.error("Failed to update generation:", updateError);
    }
  };

  const handleDelete = async () => {
    if (!id || typeof id !== "string") return;
    const result = await deleteGeneration(id);
    if (result && result.success) {
      await refetch();
      router.push(DOC_ROUTES.GENERATE);
    } else {
      console.error("Failed to delete generation:", deleteError);
    }
    setIsDeleteDialogOpen(false);
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">GitHub Repository Design</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              System architecture generated from GitHub repository analysis
            </p>
            <div className="flex flex-wrap gap-4">
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
          </CardContent>
        </Card>

        <section>
          {/* Section header with copy button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Architecture Diagram</h2>
            <CopyDiagramButton code={cleanedGithubDiagram} />
          </div>
          <MermaidDiagram chart={cleanedGithubDiagram} />
        </section>
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
                <CopyDiagramButton code={cleanedDiagram} />
              </div>
              <div className="rounded-2xl border border-border/40 bg-card/30 p-8 overflow-hidden backdrop-blur-sm shadow-inner">
                <MermaidDiagram chart={cleanedDiagram} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
