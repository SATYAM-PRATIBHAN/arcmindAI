"use client";

import { useGenerateSystem } from "../hooks/useGenerateSystem";
import { useHistory } from "@/lib/contexts/HistoryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import MermaidDiagram from "./mermaidDiagram";
import { ArchitectureData } from "../utils/types";
import MicroservicesSection from "./MicroservicesSection";
import EntitiesSection from "./EntitiesSection";
import ApiRoutesSection from "./ApiRoutesSection";
import DatabaseSchemaSection from "./DatabaseSchemaSection";
import InfrastructureSection from "./InfrastructureSection";
import Lottie from "lottie-react";
import animationData from "@/components/loaderLottie.json";

export default function GeneratePage() {
  const { refetch } = useHistory();
  const {
    generate,
    isLoading,
    error: generateError,
  } = useGenerateSystem(refetch);
  const [userInput, setUserInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<ArchitectureData | null>(
    null,
  );

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

  const handleGenerate = async () => {
    const result = await generate(userInput);
    if (result && result.success) {
      try {
        // More robust parsing: find JSON content between ```json and ```
        let cleanedOutput = result.output;

        // Find the start of JSON code block
        const jsonStartMarker = "```json";
        const jsonStart = cleanedOutput.indexOf(jsonStartMarker);
        
        if (jsonStart !== -1) {
          // Extract from after the ```json marker
          cleanedOutput = cleanedOutput.slice(jsonStart + jsonStartMarker.length);
          
          // Find the first closing ``` after the JSON start (not the last one in the entire string)
          const jsonEnd = cleanedOutput.indexOf("```");
          if (jsonEnd !== -1) {
            cleanedOutput = cleanedOutput.slice(0, jsonEnd);
          }
        } else {
          // If no ```json marker, try to find JSON object directly
          // Look for first { and matching closing } to extract JSON
          const firstBrace = cleanedOutput.indexOf("{");
          if (firstBrace !== -1) {
            // Find matching closing brace
            let braceCount = 0;
            let lastBrace = -1;
            for (let i = firstBrace; i < cleanedOutput.length; i++) {
              if (cleanedOutput[i] === "{") braceCount++;
              if (cleanedOutput[i] === "}") {
                braceCount--;
                if (braceCount === 0) {
                  lastBrace = i;
                  break;
                }
              }
            }
            if (lastBrace !== -1) {
              cleanedOutput = cleanedOutput.slice(firstBrace, lastBrace + 1);
            }
          }
        }

        // Trim whitespace
        cleanedOutput = cleanedOutput.trim();

        if (!cleanedOutput) {
          throw new Error("No JSON content found in AI response.");
        }

        const parsedData: ArchitectureData = JSON.parse(cleanedOutput);
        setGeneratedData(parsedData);
      } catch (parseError) {
        console.error("Failed to parse generated data:", parseError);
        console.error("Raw output length:", result.output.length);
        console.error(
          "Raw output preview:",
          result.output.substring(0, 500) + "...",
        );
        setGeneratedData(null);
      }
    } else {
      setError(generateError);
      setGeneratedData(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Enter your system architecture prompt..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !userInput.trim()}
        >
          {isLoading ? "Generating..." : "Generate System"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-800">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex justify-center items-center min-h-[400px]">
          <Lottie
            animationData={animationData}
            loop={true}
            style={{ width: 400, height: 400 }}
          />
        </div>
      )}

      {generatedData && !isLoading && (
        <div className="space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl">
                {generatedData.systemName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {generatedData.summary}
              </p>
            </CardContent>
          </Card>

          {/* Sections */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Microservices</h2>
            <MicroservicesSection
              microservices={generatedData.microservices}
            />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Entities</h2>
            <EntitiesSection entities={generatedData.entities} />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">API Routes</h2>
            <ApiRoutesSection apiRoutes={generatedData.apiRoutes} />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Database Schema</h2>
            <DatabaseSchemaSection
              schema={generatedData.databaseSchema}
            />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Infrastructure</h2>
            <InfrastructureSection
              infra={generatedData.infrastructure}
            />
          </section>

          {generatedData["Architecture Diagram"] && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Architecture Diagram</h2>
              <MermaidDiagram
                chart={cleanMermaidString(
                  generatedData["Architecture Diagram"],
                )}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
