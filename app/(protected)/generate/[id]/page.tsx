"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2 } from "lucide-react";
import Link from "next/link";

import { useGetGenerationById } from "../hooks/useGetGenerationById";
import { useDeleteGenerationById } from "../hooks/useDeleteGenerationById";
import { useUpdateGeneration } from "@/hooks/useUpdateGeneration";
import { useHistory } from "@/lib/contexts/HistoryContext";

import {
  MermaidDiagram,
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
} from "../components";

import Lottie from "lottie-react";
import animationData from "@/components/loaderLottie.json";
import { DOC_ROUTES } from "@/lib/routes";
import { ArchitectureData } from "../utils/types";

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
  const [isGithubRepo, setIsGithubRepo] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
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
          // Check if this is a GitHub generation
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

    // GitHub generations don't support updates yet
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

  function cleanMermaidString(input: string | undefined | null): string {
    if (!input || typeof input !== "string") return "";
    
    return input
      // Remove code block markers if present (for backward compatibility)
      .replace(/^```mermaid\n?/g, "")
      .replace(/\n?```$/g, "")
      .replace(/```/g, "")
      // Convert escaped newlines to actual newlines
      .replace(/\\n/g, "\n")
      // Handle any other escaped characters
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .trim();
  }

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

  // Render GitHub generation view
  if (isGithubRepo && githubGeneration) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ActionDialog
          open={isActionDialogOpen}
          onOpenChange={setIsActionDialogOpen}
          onSelectUpdate={() => {
            // For GitHub generations, route to the update page
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
            <DeleteDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          </CardContent>
        </Card>

        <section>
          <h2 className="text-2xl font-bold mb-4">Architecture Diagram</h2>
          <MermaidDiagram chart={cleanMermaidString(githubGeneration)} />
        </section>
      </div>
    );
  }

  // Render regular generation view
  if (!generatedData) return null; // Safety check

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

      <ActionButton onClick={() => setIsActionDialogOpen(true)} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">
            {generatedData.systemName || "System Architecture"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            {generatedData.summary || "No summary available."}
          </p>
        </CardContent>

        <div className="flex flex-col gap-2 mx-4 sm:flex-row sm:items-center">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={`/generate/${id}/frontendStructure`}>
              <Code2 className="mr-2 h-4 w-4" />
              Frontend Structure
            </Link>
          </Button>
          <DeleteDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        </div>
      </Card>

      {/* Sections */}
      {generatedData.microservices && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Microservices</h2>
          <MicroservicesSection
            microservices={generatedData.microservices}
          />
        </section>
      )}

      {generatedData.entities && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Entities</h2>
          <EntitiesSection entities={generatedData.entities} />
        </section>
      )}

      {generatedData.apiRoutes && (
        <section>
          <h2 className="text-2xl font-bold mb-4">API Routes</h2>
          <ApiRoutesSection apiRoutes={generatedData.apiRoutes} />
        </section>
      )}

      {generatedData.databaseSchema && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Database Schema</h2>
          <DatabaseSchemaSection
            schema={generatedData.databaseSchema}
          />
        </section>
      )}

      {generatedData.infrastructure && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Infrastructure</h2>
          <InfrastructureSection
            infra={generatedData.infrastructure}
          />
        </section>
      )}

      {generatedData["Architecture Diagram"] && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Architecture Diagram</h2>
          <MermaidDiagram
            chart={cleanMermaidString(generatedData["Architecture Diagram"])}
          />
        </section>
      )}
    </div>
  );
}
