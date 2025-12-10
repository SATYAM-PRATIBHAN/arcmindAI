"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { DOC_ROUTES } from "@/lib/routes";
import { useMobileDetection } from "./hooks/use-mobile-detection";
import { useMermaidRenderer } from "./hooks/use-mermaid-renderer";
import { EditorHeader } from "./editor-header";
import { CodeEditorPanel } from "./code-editor-panel";
import { DiagramPreviewPanel } from "./diagram-preview-panel";
import { AIImprovementDialog } from "./ai-improvement-dialog";
import { ApiKeyDialog } from "@/components/api-key-dialog";

interface MermaidEditorClientProps {
  generationId: string;
  initialMermaidCode: string;
  userInput: string;
}

export function MermaidEditorClient({
  generationId,
  initialMermaidCode,
  userInput,
}: MermaidEditorClientProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialMermaidCode);
  const [originalCode] = useState(initialMermaidCode);
  const [saving, setSaving] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  // Custom hooks
  const isMobile = useMobileDetection();
  const { diagramRef, renderError } = useMermaidRenderer(code);

  const handleSave = async () => {
    if (code === originalCode) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put(
        DOC_ROUTES.API.GITHUB.GENERATION(generationId),
        { mermaidCode: code },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to save changes");
      }

      toast.success("Changes saved successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error saving changes:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save changes";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCode(originalCode);
    toast.info("Code reset to original");
  };

  const handleAIImprove = (improvedCode: string) => {
    setCode(improvedCode);
    toast.success("Diagram updated! Don't forget to save your changes.");
  };

  const closeApiKeyDialog = () => {
    setShowApiKeyDialog(false);
  };

  const hasChanges = code !== originalCode;

  return (
    <div
      className={`flex flex-col gap-4 ${isMobile ? "min-h-screen" : "h-[calc(100vh-8rem)]"}`}
    >
      <ApiKeyDialog
        isOpen={showApiKeyDialog}
        onClose={closeApiKeyDialog}
        onSuccess={() => {
          closeApiKeyDialog();
          toast.info("API keys saved. Please try improving the diagram again.");
        }}
      />

      <EditorHeader
        userInput={userInput}
        hasChanges={hasChanges}
        saving={saving}
        onReset={handleReset}
        onSave={handleSave}
      />

      <PanelGroup
        direction={isMobile ? "vertical" : "horizontal"}
        className={`rounded-lg border ${isMobile ? "min-h-[1000px] flex-1" : "flex-1"}`}
      >
        <Panel defaultSize={isMobile ? 50 : 40} minSize={30}>
          <CodeEditorPanel code={code} onCodeChange={setCode} />
        </Panel>

        <PanelResizeHandle
          className={
            isMobile
              ? "h-2 bg-border hover:bg-primary/20 transition-colors"
              : "w-2 bg-border hover:bg-primary/20 transition-colors"
          }
        />

        <Panel defaultSize={isMobile ? 50 : 60} minSize={30}>
          <DiagramPreviewPanel
            diagramRef={diagramRef}
            renderError={renderError}
            onOpenAIDialog={() => setAiDialogOpen(true)}
          />
        </Panel>
      </PanelGroup>

      <AIImprovementDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        currentCode={code}
        generationId={generationId}
        onImprove={handleAIImprove}
        onShowApiKeyDialog={() => setShowApiKeyDialog(true)}
      />
    </div>
  );
}
