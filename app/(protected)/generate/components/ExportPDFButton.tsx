"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Download } from "lucide-react";
import generatePDF from "../utils/exportPDF";
import { ArchitectureData } from "../utils/types";
import { useState } from "react";
import type { VariantProps } from "class-variance-authority";
import type React from "react";

interface ExportPDFButtonProps {
  data: ArchitectureData;
  diagramRef?: React.RefObject<HTMLDivElement | null>;
  // styling overrides to allow prominent placement
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  ariaLabel?: string;
}

export default function ExportPDFButton({
  data,
  diagramRef,
  variant,
  size,
  className,
  ariaLabel,
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const diagramElement = diagramRef?.current ?? null;
      await generatePDF({
        data,
        diagramElement,
      });
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExportPDF}
      disabled={isExporting}
      variant={variant ?? "outline"}
      size={size ?? "sm"}
      className={`${className ?? "rounded-xl transition-all duration-300"}`}
      aria-label={ariaLabel ?? "Export PDF"}
    >
      {isExporting ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </>
      )}
    </Button>
  );
}
