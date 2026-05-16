"use client";

import { useGenerateSystem } from "../hooks/useGenerateSystem";
import { useHistory } from "@/lib/contexts/HistoryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useForm } from "react-hook-form";
import MermaidDiagram from "./mermaidDiagram";
import CopyDiagramButton from "./CopyDiagramButton";
import { ArchitectureData } from "../utils/types";
import { cleanMermaidString } from "../utils/cleanMermaidString";
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
  const { register, watch } = useForm();
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<ArchitectureData | null>(
    null,
  );

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
          cleanedOutput = cleanedOutput.slice(
            jsonStart + jsonStartMarker.length,
          );

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

        // 🎨 Extract mermaid diagram if present in the raw result.output
        const mermaidStartMarker = "```mermaid";
        const mermaidStart = result.output.indexOf(mermaidStartMarker);

        if (mermaidStart !== -1) {
          // Extract from after the ```mermaid marker
          let mermaidText = result.output.slice(
            mermaidStart + mermaidStartMarker.length,
          );

          // Find the first closing ``` after the mermaid start
          const mermaidEnd = mermaidText.indexOf("```");
          if (mermaidEnd !== -1) {
            mermaidText = mermaidText.slice(0, mermaidEnd);
          }

          // Clean up the mermaid diagram
          mermaidText = mermaidText
            .replace(/```mermaid/g, "")
            .replace(/```/g, "")
            .trim();

          // Add to parsedData
          if (mermaidText) {
            parsedData["Architecture Diagram"] = mermaidText;
          }
        }

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

  const userInput = watch("userInput", "");

  const MAX_INPUT_LENGTH = 2000;
  const counterColor =
    userInput.length === MAX_INPUT_LENGTH
      ? "text-red-500 font-bold"
      : userInput.length >= 1800
        ? "text-orange-500 font-medium"
        : userInput.length >= 1500
          ? "text-amber-400"
          : "text-muted-foreground";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex gap-4 items-start">
        {/* Input + counter wrapper */}
        <div className="flex-1">
          <Input
            placeholder="Enter your system architecture prompt..."
            {...register("userInput")}
            maxLength={MAX_INPUT_LENGTH}
            className="flex-1"
          />

          <div className="flex justify-end mt-1 mr-3">
            <p
              className={`text-sm transition-colors duration-700
                ${counterColor}
                ${userInput.length > 0 ? "opacity-100" : "opacity-0"}
              `}
            >
              {userInput.length}/{MAX_INPUT_LENGTH}
            </p>
          </div>
        </div>

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
              <p className="text-gray-600">{generatedData.summary}</p>
            </CardContent>
          </Card>

          {/* Sections */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Microservices</h2>
            <MicroservicesSection microservices={generatedData.microservices} />
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
            <DatabaseSchemaSection schema={generatedData.databaseSchema} />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Infrastructure</h2>
            <InfrastructureSection infra={generatedData.infrastructure} />
          </section>

          {generatedData["Architecture Diagram"] && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Architecture Diagram</h2>
                <CopyDiagramButton
                  code={cleanMermaidString(
                    generatedData["Architecture Diagram"],
                  )}
                />
              </div>
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
