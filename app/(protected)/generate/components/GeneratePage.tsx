"use client";

import { useGenerateSystem } from "../hooks/useGenerateSystem";
import { useHistory } from "@/lib/contexts/HistoryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import SignUpPromptDialog from "./SignUpPromptDialog";
import MermaidDiagram from "./mermaidDiagram";
import CopyDiagramButton from "./CopyDiagramButton";
import { ArchitectureData } from "../utils/types";
import { cleanMermaidString } from "../utils/cleanMermaidString";
import MicroservicesSection from "./MicroservicesSection";
import EntitiesSection from "./EntitiesSection";
import ApiRoutesSection from "./ApiRoutesSection";
import DatabaseSchemaSection from "./DatabaseSchemaSection";
import InfrastructureSection from "./InfrastructureSection";
import { StarterTemplates } from "@/components/prompt";
import Lottie from "lottie-react";
import animationData from "@/components/loaderLottie.json";
import { Sparkles, Send, AlertCircle } from "lucide-react";

export default function GeneratePage() {
  const { refetch } = useHistory();
  const {
    generate,
    isLoading,
    error: generateError,
  } = useGenerateSystem(refetch);
  const { register, watch, setValue } = useForm();
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<ArchitectureData | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: session } = useSession();
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsGuestMode(localStorage.getItem("guestMode") === "true");
    }
  }, []);

  // Seamless Transfer of Guest Generation on Signup/Login
  useEffect(() => {
    const transferGuestGeneration = async () => {
      const guestGen = localStorage.getItem("guestGeneration");
      // @ts-expect-error id is added to session custom properties
      if (guestGen && session?.user?.id) {
        try {
          const parsed = JSON.parse(guestGen);
          const response = await axios.post("/api/generate/transfer", {
            userInput: parsed.userInput,
            generatedOutput: parsed.generatedOutput,
          });
          if (response.data.success) {
            localStorage.removeItem("guestGeneration");
            localStorage.removeItem("guestMode");
            setIsGuestMode(false);
            toast.success("✨ Your guest architecture design has been saved to your account history!");
            if (refetch) refetch(); // Refresh history
          }
        } catch (err) {
          console.error("Failed to transfer guest generation:", err);
          toast.error("Failed to save guest generation to your account.");
        }
      }
    };
    // @ts-expect-error id is added to session custom properties
    if (session?.user?.id) {
      transferGuestGeneration();
    }
  }, [session, refetch]);

  const userInput = watch("userInput", "");

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 400);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [userInput]);

  const registerField = register("userInput");

  const handleRef = (el: HTMLTextAreaElement | null) => {
    textareaRef.current = el;
    if (registerField.ref) {
      if (typeof registerField.ref === "function") {
        registerField.ref(el);
      } else if ("current" in registerField.ref) {
        (
          registerField.ref as React.MutableRefObject<HTMLTextAreaElement | null>
        ).current = el;
      }
    }
  };

  const { ref, ...restRegisterField } = registerField;

  const MAX_INPUT_LENGTH = 2000;

  const handleSelectTemplate = (templateBody: string) => {
    setValue("userInput", templateBody.substring(0, MAX_INPUT_LENGTH));
  };

  const handleGenerate = async () => {
    const result = await generate(userInput);
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

        // If guest mode is active, trigger CTA to save the generation!
        if (isGuestMode) {
          localStorage.setItem(
            "guestGeneration",
            JSON.stringify({ userInput, generatedOutput: parsedData })
          );
          setIsSignUpModalOpen(true);
        }
      } catch (parseError) {
        console.error("Failed to parse generated data:", parseError);
        setGeneratedData(null);
      }
    } else {
      setError(generateError);
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
      {/* If guest and has data, show the warning banner! */}
      {isGuestMode && generatedData && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400 text-center sm:text-left">
              ⚠️ You are previewing a <strong>Guest Generation</strong>. Sign up now to save it to your account!
            </p>
          </div>
          <Button
            onClick={() => setIsSignUpModalOpen(true)}
            size="sm"
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium px-4 shadow-sm"
          >
            Save Architecture
          </Button>
        </div>
      )}

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
                      onClick={handleGenerate}
                      disabled={isLoading || !userInput.trim()}
                      size="lg"
                      className="rounded-xl px-6 transition-all duration-300 active:scale-95"
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Processing
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

      {error && (
        <Card className="border-destructive/20 bg-destructive/5 rounded-2xl">
          <CardContent className="p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-destructive">
                Generation Failed
              </p>
              <p className="text-sm text-destructive/80">{error}</p>
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
                  <CopyDiagramButton
                    code={cleanMermaidString(
                      generatedData["Architecture Diagram"],
                    )}
                  />
                </div>
                <div className="rounded-2xl border border-border/40 bg-card/30 p-8 overflow-hidden backdrop-blur-sm shadow-inner">
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

      <SignUpPromptDialog open={isSignUpModalOpen} onOpenChange={setIsSignUpModalOpen} />
    </div>
  );
}
