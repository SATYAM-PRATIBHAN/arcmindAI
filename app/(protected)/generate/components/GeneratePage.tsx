"use client";
import ExportPDFButton from "./ExportPDFButton";

import animationData from "@/components/loaderLottie.json";
import { StarterTemplates } from "@/components/prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ArchitectureData } from "../utils/types";
import { useGenerateSystem } from "../hooks/useGenerateSystem";
import StarRating from "@/components/ui/star-rating";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { DOC_ROUTES } from "@/lib/routes";
import GuestSignupPrompt from "./GuestSignupPrompt";
import { useHistory } from "@/lib/contexts/HistoryContext";
import Lottie from "lottie-react";
import { AlertCircle, RotateCw, Send, Sparkles } from "lucide-react";
import { useRateLimitCountdown } from "@/hooks/use-rate-limit-countdown";
import { RateLimitBanner } from "@/components/rate-limit-banner";
import { cleanMermaidString } from "../utils/cleanMermaidString";

import ApiRoutesSection from "./ApiRoutesSection";
import CopyDiagramButton from "./CopyDiagramButton";
import DatabaseSchemaSection from "./DatabaseSchemaSection";
import EntitiesSection from "./EntitiesSection";
import InfrastructureSection from "./InfrastructureSection";
import MermaidDiagram from "./mermaidDiagram";
import MicroservicesSection from "./MicroservicesSection";

const GUEST_GENERATION_STORAGE_KEY = "arcmind.guest.generations.used";
const GUEST_GENERATION_COOKIE_KEY = "arcmind_guest_generations_used";
const GUEST_UNSAVED_GENERATION_KEY = "arcmind.guest.unsaved_generation";
const MAX_FREE_GUEST_GENERATIONS = 1;

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
  // Track generation ID for rating purposes after generation completes
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  const [streamingProgress, setStreamingProgress] = useState<string>("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mermaidContainerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const submittedTextRef = useRef<string>("");

  const userInput = watch("userInput", "");

  const { data: session, status } = useSession();
  const [guestGenerationsUsed, setGuestGenerationsUsed] = useState(0);
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);

  const isAuthenticated = Boolean(
    // @ts-expect-error id is added to session in NextAuth callbacks
    session?.user?.id,
  );
  const isGuestReady = status !== "loading" && !isAuthenticated;
  const isGuestLocked =
    isGuestReady && guestGenerationsUsed >= MAX_FREE_GUEST_GENERATIONS;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedCountStr = localStorage.getItem(GUEST_GENERATION_STORAGE_KEY);

    if (storedCountStr !== null) {
      const storedCount = Number.parseInt(storedCountStr, 10);
      if (!Number.isNaN(storedCount)) {
        setGuestGenerationsUsed(storedCount);
        return;
      }
    }

    const cookieValue = document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${GUEST_GENERATION_COOKIE_KEY}=`))
      ?.split("=")[1];

    const parsedCookieValue = Number.parseInt(cookieValue || "0", 10);
    setGuestGenerationsUsed(
      Number.isNaN(parsedCookieValue) ? 0 : parsedCookieValue,
    );
  }, []);

  const persistGuestUsage = (count: number) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(GUEST_GENERATION_STORAGE_KEY, count.toString());
    document.cookie = `${GUEST_GENERATION_COOKIE_KEY}=${count}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  };

  // Sync or restore unsaved guest generation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUnsavedGeneration = async () => {
      const unsaved = localStorage.getItem(GUEST_UNSAVED_GENERATION_KEY);
      if (!unsaved) return;

      if (isAuthenticated) {
        try {
          const { userInput, generatedData } = JSON.parse(unsaved);
          const res = await fetch("/api/generate/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userInput, generatedOutput: generatedData }),
          });
          if (res.ok) {
            localStorage.removeItem(GUEST_UNSAVED_GENERATION_KEY);
            refetch();
          }
        } catch (error) {
          console.error("Failed to sync guest generation:", error);
        }
      } else {
        // Restore to UI for guests on refresh
        try {
          const { userInput, generatedData: savedData } = JSON.parse(unsaved);
          if (savedData) {
            setGeneratedData(savedData);
            if (userInput) {
              setValue("userInput", userInput);
            }
          }
        } catch (error) {
          console.error("Failed to restore guest generation:", error);
        }
      }
    };

    handleUnsavedGeneration();
  }, [isAuthenticated, refetch, setValue]);

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 400);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [userInput]);

  // Auto-scroll terminal during streaming
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [streamingProgress]);

  const getPipelineStage = (progressLength: number) => {
    if (progressLength === 0) return 0; // Initializing / Schema Ingestion
    if (progressLength > 0 && progressLength < 400) return 1; // Entity Clustering
    return 2; // Infrastructure Compilation
  };

  const currentStage = getPipelineStage(streamingProgress.length);

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
    if (isGuestLocked) {
      setIsGuestPromptOpen(true);
      return;
    }

    setGeneratedData(null);
    setStreamingProgress("");

    if (isRateLimited) return;

    submittedTextRef.current = userInput;

    try {
      const result = await generate(userInput, (chunk: string) => {
        setStreamingProgress((prev) => prev + chunk);
      });

      if (retryAfter !== null) {
        startCountdown(retryAfter);
      } else if (result?.remaining === 0 && result?.reset) {
        const secondsUntilReset = Math.ceil(
          (new Date(result.reset).getTime() - Date.now()) / 1000,
        );
        startCountdown(Math.max(secondsUntilReset, 1));
      }

      console.log("FULL RESULT:", result);

      if (result && result.success) {
        // store generation ID for later rating
        if (result.generationId) {
          setGenerationId(result.generationId);
        }

        let finalParsedData: ArchitectureData | null = null;
        if (result.parsedData) {
          finalParsedData = result.parsedData;
        } else {
          // Fallback to manual parsing if backend didn't provide parsedData
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
                  cleanedOutput = cleanedOutput.slice(
                    firstBrace,
                    lastBrace + 1,
                  );
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

            finalParsedData = parsedData;
          } catch (parseError) {
            console.error("Failed to parse generated data:", parseError);
            setGeneratedData(null);
          }
        }

        if (finalParsedData) {
          setGeneratedData(finalParsedData);
          if (isGuestReady) {
            const updatedCount = guestGenerationsUsed + 1;
            setGuestGenerationsUsed(updatedCount);
            persistGuestUsage(updatedCount);

            localStorage.setItem(
              GUEST_UNSAVED_GENERATION_KEY,
              JSON.stringify({ userInput, generatedData: finalParsedData }),
            );
          }
        }
      } else {
        setGeneratedData(null);
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setGeneratedData(null);
    }
  };

  // Handle user rating submission
  const handleRate = async (value: number) => {
    if (!generationId || isRatingLoading) return;

    try {
      setIsRatingLoading(true);
      setRating(value);

      const response = await fetch(`/api/generate/${generationId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save rating");
      }
    } catch (error) {
      console.error("Failed to save rating:", error);
    } finally {
      setIsRatingLoading(false);
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
      <GuestSignupPrompt
        open={isGuestPromptOpen}
        onOpenChange={setIsGuestPromptOpen}
      />
      {!generatedData && (
        <div className="space-y-4">
          {isGuestLocked && (
            <Card className="border-border/60 bg-card/40 rounded-2xl shadow-sm">
              <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Guest mode limit reached
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sign up to save your architecture history and continue
                    generating.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setIsGuestPromptOpen(true)}
                  >
                    View Benefits
                  </Button>
                  <Button className="rounded-xl" asChild>
                    <Link href={DOC_ROUTES.AUTH.SIGN_UP}>
                      Create Free Account
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
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
                      disabled={
                        isLoading ||
                        !userInput.trim() ||
                        isRateLimited ||
                        isGuestLocked
                      }
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
        <div className="w-full max-w-5xl mx-auto py-16 px-8 animate-in fade-in duration-700">
          {/* Upper Section: Formal Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 mb-8 border-b border-border/60 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                  System Generation Protocol
                </p>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Synthesizing Architecture Canvas
              </h2>
            </div>

            {/* Enterprise Status Metadata */}
            <div className="flex items-center gap-6 font-mono text-[11px] text-muted-foreground/70">
              <div className="hidden sm:block">
                <span className="text-muted-foreground/40 block text-[9px] uppercase tracking-wider">
                  Engine
                </span>
                <span className="font-medium text-foreground">
                  v4.12.0-core
                </span>
              </div>
              <div className="h-6 w-px bg-border/60"></div>
              <div>
                <span className="text-muted-foreground/40 block text-[9px] uppercase tracking-wider">
                  Payload
                </span>
                <span className="font-medium text-foreground">
                  {streamingProgress.length
                    ? `${streamingProgress.length} Chars`
                    : "0 Chars"}
                </span>
              </div>
            </div>
          </div>

          {/* Main Architectural Body Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 border border-border/80 rounded-lg overflow-hidden bg-card/10 shadow-sm">
            {/* Left Column: Dynamic Progress Sidebar */}
            <div className="p-8 flex flex-col justify-between bg-muted/20 md:border-r border-border/60">
              <div className="space-y-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Pipeline Stages
                </h3>

                <nav className="space-y-4 font-mono text-xs">
                  {/* Stage 1 */}
                  <div
                    className={`flex items-center gap-3 transition-colors duration-300 ${currentStage === 0 ? "text-foreground font-medium" : currentStage > 0 ? "text-muted-foreground/50" : "text-muted-foreground/30"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold transition-all ${currentStage > 0 ? "bg-primary/5 border-primary/30 text-primary" : "bg-background border-primary/60 animate-pulse"}`}
                    >
                      {currentStage > 0 ? "✓" : "→"}
                    </div>
                    <span>01. Schema Ingestion</span>
                  </div>

                  {/* Stage 2 */}
                  <div
                    className={`flex items-center gap-3 transition-colors duration-300 ${currentStage === 1 ? "text-foreground font-medium" : currentStage > 1 ? "text-muted-foreground/50" : "text-muted-foreground/30"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold transition-all ${currentStage > 1 ? "bg-primary/5 border-primary/30 text-primary" : currentStage === 1 ? "bg-background border-primary/60 animate-pulse text-primary" : "border-border bg-background/50"}`}
                    >
                      {currentStage > 1 ? "✓" : currentStage === 1 ? "→" : ""}
                    </div>
                    <span>02. Entity Clustering</span>
                  </div>

                  {/* Stage 3 */}
                  <div
                    className={`flex items-center gap-3 transition-colors duration-300 ${currentStage === 2 ? "text-foreground font-medium" : "text-muted-foreground/30"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold transition-all ${currentStage === 2 ? "bg-background border-primary/60 animate-pulse text-primary" : "border-dashed border-border bg-background/50"}`}
                    >
                      {currentStage === 2 ? "→" : ""}
                    </div>
                    <span>03. Infrastructure Compilation</span>
                  </div>
                </nav>
              </div>

              {/* Minimal Animated Geometric Indicator */}
              <div className="pt-8 mt-8 border-t border-border/40 hidden md:flex items-center gap-4">
                <div className="opacity-40 scale-75 origin-left mix-blend-luminosity">
                  <Lottie
                    animationData={animationData}
                    loop={true}
                    style={{ width: 50, height: 50 }}
                  />
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/50 leading-tight uppercase tracking-wider">
                  {currentStage === 0 && "Parsing incoming payload..."}
                  {currentStage === 1 && "Mapping model nodes..."}
                  {currentStage === 2 && "Compiling cloud templates..."}
                </p>
              </div>
            </div>

            {/* Premium Dark Right Column: The Formatted Technical Stream */}
            <div className="md:col-span-2 bg-zinc-950 p-8 flex flex-col justify-between min-h-[360px] text-zinc-100">
              {/* Stream Dynamic Window */}
              <div className="relative flex-1">
                {streamingProgress ? (
                  <div
                    ref={terminalRef}
                    className="absolute inset-0 overflow-y-auto font-mono text-[11px] leading-6 scrollbar-none select-text"
                  >
                    {/* Header/File Signature inside the premium stream block */}
                    <div className="text-zinc-500 text-[10px] uppercase tracking-wider select-none pb-3 border-b border-zinc-900/80 mb-4 flex items-center justify-between">
                      <span>{"//"} core_synthesis_engine.log</span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] lowercase animate-pulse">
                        live compile
                      </span>
                    </div>

                    {/* Code-like Output Container */}
                    <div className="space-y-1 font-mono tracking-normal text-zinc-300">
                      {streamingProgress.split("\n").map((line, index) => {
                        if (!line.trim() && index !== 0) return null;

                        // Smart Premium Color Modifiers based on content
                        const isError =
                          line.toLowerCase().includes("error") ||
                          line.toLowerCase().includes("fail");
                        const isSuccess =
                          line.toLowerCase().includes("success") ||
                          line.toLowerCase().includes("complete") ||
                          line.includes("✓");
                        const isConfig =
                          line.includes(">>") ||
                          line.includes("{") ||
                          line.includes("}");

                        return (
                          <div
                            key={index}
                            className="flex items-start gap-4 hover:bg-zinc-900/40 px-2 py-0.5 rounded transition-colors group"
                          >
                            {/* Static Clean Line Numbering */}
                            <span className="text-zinc-700 text-right select-none w-5 text-[10px] pt-0.5 font-light group-hover:text-zinc-500">
                              {String(index + 1).padStart(2, "0")}
                            </span>

                            {/* Clean Line Parsing */}
                            <p
                              className={`flex-1 whitespace-pre-wrap break-all ${
                                isError
                                  ? "text-rose-400 font-medium"
                                  : isSuccess
                                    ? "text-emerald-400 font-medium"
                                    : isConfig
                                      ? "text-sky-400/90"
                                      : "text-zinc-300"
                              }`}
                            >
                              {line}
                            </p>
                          </div>
                        );
                      })}

                      {/* Inline tracking cursor at the true termination point of text */}
                      <div className="flex items-start gap-4 px-2 pt-0.5">
                        <span className="text-zinc-700 select-none w-5 text-[10px] font-light">
                          {String(
                            streamingProgress.split("\n").filter(Boolean)
                              .length + 1,
                          ).padStart(2, "0")}
                        </span>
                        <span className="inline-block w-1.5 h-4 bg-primary/80 animate-pulse opacity-90 align-middle" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center gap-3 text-center py-12">
                    <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary/80 animate-spin" />
                    <p className="font-mono text-xs text-zinc-500 tracking-tight">
                      Awaiting output buffer generation sequence...
                    </p>
                  </div>
                )}
              </div>

              {/* Stream Bottom Metadata Bar */}
              <div className="mt-6 pt-4 border-t border-zinc-900/80 flex items-center justify-between font-mono text-[10px] text-zinc-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sandbox Cloud Cluster</span>
                </div>
                <span>TLS Secure Feed</span>
              </div>
            </div>
          </div>

          {/* Undertext: Strict Corporate Footnote */}
          <p className="text-center text-muted-foreground/40 text-[11px] mt-6 tracking-wide font-light">
            System creation typically requires 15 to 30 seconds depending on
            relational constraints.
          </p>
        </div>
      )}

      {generatedData && !isLoading && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="space-y-4">
            {isGuestReady && (
              <Card className="border-border/60 bg-card/40 rounded-2xl shadow-sm">
                <CardContent className="py-4 px-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    You are using{" "}
                    <span className="font-medium">Guest Mode</span>. Save this
                    and continue generating by creating an account.
                  </p>
                  <Button className="rounded-xl" asChild>
                    <Link href={DOC_ROUTES.AUTH.SIGN_UP}>Sign Up to Save</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            {isGuestLocked && (
              <Card className="border-border/60 bg-card/40 rounded-2xl shadow-sm">
                <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Guest mode limit reached
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sign up to save your architecture history and continue
                      generating.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setIsGuestPromptOpen(true)}
                    >
                      View Benefits
                    </Button>
                    <Button className="rounded-xl" asChild>
                      <Link href={DOC_ROUTES.AUTH.SIGN_UP}>
                        Create Free Account
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
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
              {/* Added Rating Component */}
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-sm text-muted-foreground">
                  Rate this architecture generation
                </p>
                <StarRating
                  rating={rating}
                  onRate={handleRate}
                  disabled={isRatingLoading}
                  size={24}
                />
              </div>
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
