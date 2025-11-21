"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
          try {
            setGeneratedData(result.output.generatedOutput as ArchitectureData);
          } catch {
            setGeneratedData(null);
          }
        } else {
          setGeneratedData(null);
        }
      }
    };
    fetchGeneration();
  }, [id]);

  const handleUpdate = async () => {
    if (!id || typeof id !== "string" || !responseText.trim()) return;
    const result = await updateGeneration(id, responseText);
    if (result && result.success) {
      const updatedResult = await getGenerationById(id);
      if (updatedResult && updatedResult.success) {
        setGeneratedData(
          updatedResult.output.generatedOutput as ArchitectureData,
        );
      }
      setResponseText("");
      setIsActionDialogOpen(false);
    } else {
      console.error("Failed to update generation:", updateError);
    }
  };

  const handleAskDoubt = async (question?: string) => {
    // The doubt is handled in the AskDoubtCard component
    // This function can be used for any additional logic after asking a doubt
    console.log("Doubt submitted:", question);
    // Do not reset doubtText here as it's handled in the component
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

  function cleanMermaidString(input: string) {
    return input
      .replace(/^```mermaid\n?/, "")
      .replace(/\n?```$/, "")
      .replace(/\\n/g, "\n")
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

  if (error || !generatedData) {
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
        onSubmit={handleAskDoubt}
        generationId={id as string}
      />

      <ActionButton onClick={() => setIsActionDialogOpen(true)} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">
            {generatedData.Explanation.systemName}
          </CardTitle>
          <DeleteDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{generatedData.Explanation.summary}</p>
        </CardContent>
      </Card>

      {/* Sections */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Microservices</h2>
        <MicroservicesSection
          microservices={generatedData.Explanation.microservices}
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Entities</h2>
        <EntitiesSection entities={generatedData.Explanation.entities} />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">API Routes</h2>
        <ApiRoutesSection apiRoutes={generatedData.Explanation.apiRoutes} />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Database Schema</h2>
        <DatabaseSchemaSection
          schema={generatedData.Explanation.databaseSchema}
        />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Infrastructure</h2>
        <InfrastructureSection
          infra={generatedData.Explanation.infrastructure}
        />
      </section>

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
