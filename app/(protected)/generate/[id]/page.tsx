"use client";

import { useGetGenerationById } from "../hooks/useGetGenerationById";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import MermaidDiagram from "../components/mermaidDiagram";
import { ArchitectureData } from "../utils/types";
import MicroservicesSection from "../components/MicroservicesSection";
import EntitiesSection from "../components/EntitiesSection";
import ApiRoutesSection from "../components/ApiRoutesSection";
import DatabaseSchemaSection from "../components/DatabaseSchemaSection";
import InfrastructureSection from "../components/InfrastructureSection";
import axios from "axios";

export default function GenerationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getGenerationById, isLoading, error } = useGetGenerationById();
  const [generatedData, setGeneratedData] = useState<ArchitectureData | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id || typeof id !== "string") return;

    setIsDeleting(true);
    try {
      const response = await axios.delete(`/api/generate/${id}`);

      if (response.status >= 200 && response.status < 300) {
        router.push("/generate");
      } else {
        console.error("Failed to delete generation");
      }
    } catch (error) {
      console.error("Error deleting generation:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    const fetchGeneration = async () => {
      if (id && typeof id === "string") {
        const result = await getGenerationById(id);
        if (result && result.success) {
          try {
            const parsedData: ArchitectureData = result.output
              .generatedOutput as ArchitectureData;
            setGeneratedData(parsedData);
          } catch (parseError) {
            console.error("Failed to parse generated data:", parseError);
            setGeneratedData(null);
          }
        } else {
          console.error("Error:", error);
          setGeneratedData(null);
        }
      }
    };
    fetchGeneration();
  }, [id]);

  function cleanMermaidString(input: string) {
    return input
      .replace(/^```mermaid\n?/, "")
      .replace(/\n?```$/, "")
      .replace(/\\n/g, "\n")
      .trim();
  }

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-800">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!generatedData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <p className="text-yellow-800">
              Generation not found or failed to load.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">
            {generatedData.Explanation.systemName}
          </CardTitle>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Generation</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this generation? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{generatedData.Explanation.summary}</p>
        </CardContent>
      </Card>

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

      <section>
        <h2 className="text-2xl font-bold mb-4">Architecture Diagram</h2>
        <MermaidDiagram
          chart={cleanMermaidString(generatedData["Architecture Diagram"])}
        />
      </section>
    </div>
  );
}
