"use client";
import ExportPDFButton from "./ExportPDFButton";

import animationData from "@/components/loaderLottie.json";
import { StarterTemplates } from "@/components/prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "@/lib/contexts/HistoryContext";
import Lottie from "lottie-react";
import { AlertCircle, RotateCw, Send, Sparkles } from "lucide-react";
import { useGenerateSystem } from "../hooks/useGenerateSystem";
import { useRateLimitCountdown } from "@/hooks/use-rate-limit-countdown";
import { RateLimitBanner } from "@/components/rate-limit-banner";
import { cleanMermaidString } from "../utils/cleanMermaidString";
import { ArchitectureData } from "../utils/types";
import ApiRoutesSection from "./ApiRoutesSection";
import CopyDiagramButton from "./CopyDiagramButton";
import DatabaseSchemaSection from "./DatabaseSchemaSection";
import EntitiesSection from "./EntitiesSection";
import InfrastructureSection from "./InfrastructureSection";
import MermaidDiagram from "./mermaidDiagram";
import MicroservicesSection from "./MicroservicesSection";

export default function GeneratePage() {
  const { refetch } = useHistory();
  const {
    generate,
    isLoading,
    error: generateError,
    retryAfter,
  } = useGenerateSystem(refetch);

  const { secondsLeft, totalSeconds, isRateLimited, startCountdown } =
    useRateLimitCountdown();
  const { register, watch, setValue } = useForm();
  const [generatedData, setGeneratedData] = useState<ArchitectureData | null>(
    null,
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mermaidContainerRef = useRef<HTMLDivElement>(null);
  const submittedTextRef = useRef<string>("");

  const userInput = watch("userInput", "");

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 400);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [userInput]);

  const showError = !!generateError && userInput === submittedTextRef.current;

  const registerField = register("userInput");

  const handleRef = (el: HTMLTextAreaElement | null) => {
    textareaRef.current = el;
    if (registerRef) {
      if (typeof registerRef === "function") {
        registerRef(el);
      } else if ("current" in registerRef) {
        (
          registerRef as React.MutableRefObject<HTMLTextAreaElement | null>
        ).current = el;
      }
    }
  };

  const { ref: registerRef, ...restRegisterField } = registerField;

  const MAX_INPUT_LENGTH = 2000;

  const handleSelectTemplate = (templateBody: string) => {
    setValue("userInput", templateBody.substring(0, MAX_INPUT_LENGTH));
  };

  const handleGenerate = async () => {
    if (isRateLimited) return;
    submittedTextRef.current = userInput;
    const result = await generate(userInput);

    if (retryAfter !== null) {
      startCountdown(retryAfter);
    }
    if (result && result.success) {
      try {
        let cleanedOutput = result.output;
        const jsonStartMarker = "```json";
        const jsonStart = cleanedOutput.indexOf(jsonStartMarker);

        if (jsonStart !== -1) {
          cleanedOutput = cleanedOutput.slice(
            jsonStart + jsonStartMarker.length,
          );
          const jsonEnd = cleanedOutput.indexOf("```");
          if (jsonEnd !== -1) {
            cleanedOutput = cleanedOutput.slice(0, jsonEnd);
          }
        } else {
          const firstBrace = cleanedOutput.indexOf("{");
          if (firstBrace !== -1) {
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

        cleanedOutput = cleanedOutput.trim();

        if (!cleanedOutput) {
          throw new Error("No JSON content found in AI response.");
        }

        const parsedData: ArchitectureData = JSON.parse(cleanedOutput);

        const mermaidStartMarker = "```mermaid";
        const mermaidStart = result.output.indexOf(mermaidStartMarker);

        if (mermaidStart !== -1) {
          let mermaidText = result.output.slice(
            mermaidStart + mermaidStartMarker.length,
          );
          const mermaidEnd = mermaidText.indexOf("```");
          if (mermaidEnd !== -1) {
            mermaidText = mermaidText.slice(0, mermaidEnd);
          }
          mermaidText = mermaidText
            .replace(/```mermaid/g, "")
            .replace(/```/g, "")
            .trim();
          if (mermaidText) {
            parsedData["Architecture Diagram"] = mermaidText;
          }
        }

        setGeneratedData(parsedData);
      } catch (parseError) {
        console.error("Failed to parse generated data:", parseError);
        setGeneratedData(null);
      }
    } else {
      setGeneratedData(null);
    }
  };

  const counterColor =
    userInput.length === MAX_INPUT_LENGTH
      ? "text-destructive font-bold"
      : userInput.length >= 1800
        ? "text-amber-500 font-medium"
        : "text-muted-foreground/60";

  return (
    <div className="container max-w-5xl mx-auto p-8 space-y-12">
      {!generatedData && (
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-border/50 to-border/50 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
            <Card className="relative border-border/60 shadow-lg bg-card/50 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 flex flex-col space-y-3">
                  <Textarea
                    ref={handleRef}
                    placeholder="Describe the system architecture you want to generate..."
                    {...restRegisterField}
                    maxLength={MAX_INPUT_LENGTH}
                    className="min-h-[120px] w-full bg-transparent border-none shadow-none focus-visible:ring-0 text-lg resize-none placeholder:text-muted-foreground/50 p-2"
                  />

                  <div className="flex items-center justify-between border-t border-border/40 pt-4 px-2">
                    <div className="flex items-center gap-4">
                      <p
                        className={`text-xs transition-opacity duration-300 ${userInput.length > 0 ? "opacity-100" : "opacity-0"} ${counterColor}`}
                      >
                        {userInput.length} / {MAX_INPUT_LENGTH}
                      </p>
                    </div>

                    <Button
                      onClick={() => handleGenerate()}
                      disabled={isLoading || !userInput.trim() || isRateLimited}
                      size="lg"
                      className="rounded-xl px-6 transition-all duration-300 active:scale-95"
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Processing
                        </>
                      ) : showError ? (
                        <>
                          <RotateCw className="w-4 h-4 mr-2" />
                          Retry
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {!isLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <StarterTemplates
                onSelectTemplate={handleSelectTemplate}
                isVisible={true}
              />
            </div>
          )}
        </div>
      )}

      {isRateLimited && (
        <RateLimitBanner
          secondsLeft={secondsLeft!}
          totalSeconds={totalSeconds!}
        />
      )}

      {showError && !isRateLimited && (
        <Card className="border-destructive/20 bg-destructive/5 rounded-2xl">
          <CardContent className="p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-destructive">
                Generation Failed
              </p>
              <p className="text-sm text-destructive/80">{generateError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-col justify-center items-center min-h-[400px] space-y-8 animate-in fade-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150 animate-pulse"></div>
            <Lottie
              animationData={animationData}
              loop={true}
              style={{ width: 300, height: 300 }}
              className="relative grayscale opacity-80"
            />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-medium tracking-tight">
              Architecting your system
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Our AI is designing the components, routes, and infrastructure for
              your project.
            </p>
          </div>
        </div>
      )}

      {generatedData && !isLoading && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-border/60"></div>
              <Sparkles className="w-4 h-4 text-muted-foreground/60" />
              <div className="h-px flex-1 bg-border/60"></div>
            </div>

            <div className="text-center space-y-3">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {generatedData.systemName}
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {generatedData.summary}
              </p>
            </div>
            {/* Primary actions: Export PDF visible immediately after generation */}
            <div className="flex justify-center items-center gap-3 mt-4">
              <ExportPDFButton
                data={generatedData}
                diagramRef={mermaidContainerRef}
                variant="default"
                size="lg"
                className="rounded-2xl px-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-16 pt-8">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-foreground text-background px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
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

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-foreground text-background px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  02
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Core Entities
                </h2>
              </div>
              <EntitiesSection entities={generatedData.entities} />
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-foreground text-background px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  03
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  API Infrastructure
                </h2>
              </div>
              <ApiRoutesSection apiRoutes={generatedData.apiRoutes} />
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-foreground text-background px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  04
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Database Architecture
                </h2>
              </div>
              <DatabaseSchemaSection schema={generatedData.databaseSchema} />
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-foreground text-background px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  05
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Deployment & Infra
                </h2>
              </div>
              <InfrastructureSection infra={generatedData.infrastructure} />
            </section>

            {generatedData["Architecture Diagram"] && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-foreground text-background px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                      06
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      Architecture Visual
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <CopyDiagramButton
                      code={cleanMermaidString(
                        generatedData["Architecture Diagram"],
                      )}
                    />
                    <ExportPDFButton
                      data={generatedData}
                      diagramRef={mermaidContainerRef}
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div
                  ref={mermaidContainerRef}
                  className="rounded-2xl border border-border/40 bg-card/30 p-8 overflow-hidden backdrop-blur-sm shadow-inner"
                >
                  <MermaidDiagram
                    chart={cleanMermaidString(
                      generatedData["Architecture Diagram"],
                    )}
                  />
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
