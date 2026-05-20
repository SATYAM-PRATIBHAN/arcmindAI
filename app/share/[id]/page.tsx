"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import {
  MermaidDiagram,
  CopyDiagramButton,
  MicroservicesSection,
  EntitiesSection,
  ApiRoutesSection,
  DatabaseSchemaSection,
  InfrastructureSection,
} from "@/app/(protected)/generate/components";
import { ArchitectureData } from "@/app/(protected)/generate/utils/types";
import { cleanMermaidString } from "@/app/(protected)/generate/utils/cleanMermaidString";
import Lottie from "lottie-react";
import animationData from "@/components/loaderLottie.json";

export default function SharePage() {
  const { id } = useParams();
  const [generatedData, setGeneratedData] = useState<ArchitectureData | null>(
    null,
  );
  const [githubGeneration, setGithubGeneration] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeneration = async () => {
      try {
        const response = await fetch(`/api/share/${id}`);
        if (!response.ok) {
          throw new Error("Generation not found or not public");
        }
        const result = await response.json();

        if (result.githubGeneration) {
          setGithubGeneration(result.githubGeneration);
        } else if (result.generatedOutput) {
          setGeneratedData(result.generatedOutput as ArchitectureData);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGeneration();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Lottie
          animationData={animationData}
          loop={true}
          style={{ width: 200, height: 200 }}
        />
      </div>
    );
  }

  if (error || (!generatedData && !githubGeneration)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
        <p className="text-muted-foreground">{error || "Design not found"}</p>
      </div>
    );
  }

  const cleanedDiagram = generatedData?.["Architecture Diagram"]
    ? cleanMermaidString(generatedData["Architecture Diagram"])
    : githubGeneration
      ? cleanMermaidString(githubGeneration)
      : "";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-12 bg-border/60"></div>
              <Sparkles className="w-4 h-4 text-muted-foreground/60" />
              <div className="h-px w-12 bg-border/60"></div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {generatedData?.systemName || "System Architecture"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {generatedData?.summary ||
                (githubGeneration
                  ? "Shared Github Repository Architecture"
                  : "No summary available.")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-20 pt-12">
            {githubGeneration && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Visual
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      Architecture Diagram
                    </h2>
                  </div>
                  <CopyDiagramButton code={cleanedDiagram} />
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/30 p-8 overflow-hidden backdrop-blur-sm shadow-inner">
                  <MermaidDiagram chart={cleanedDiagram} />
                </div>
              </section>
            )}

            {generatedData && (
              <>
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
                    <DatabaseSchemaSection
                      schema={generatedData.databaseSchema}
                    />
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
                    <InfrastructureSection
                      infra={generatedData.infrastructure}
                    />
                  </section>
                )}

                {cleanedDiagram && (
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
