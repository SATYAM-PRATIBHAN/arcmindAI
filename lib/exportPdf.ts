import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";
import { ArchitectureData } from "@/app/(protected)/generate/utils/types";

export const exportSystemDesignPdf = async (
  data: ArchitectureData,
  diagramElementId?: string
) => {
  const doc = new jsPDF();
  let yPos = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const maxWidth = doc.internal.pageSize.width - margin * 2;

  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  const addWrappedText = (text: string, fontSize: number, isBold = false) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text || "", maxWidth);
    const lineHeight = fontSize * 0.4;
    checkPageBreak(lines.length * lineHeight);
    doc.text(lines, margin, yPos);
    yPos += lines.length * lineHeight + 5;
  };

  addWrappedText(`System Design: ${data.systemName}`, 18, true);
  yPos += 5;

  addWrappedText("Summary", 14, true);
  addWrappedText(data.summary, 11);
  yPos += 5;

  if (data.microservices && data.microservices.length > 0) {
    addWrappedText("Microservices", 14, true);
    data.microservices.forEach((ms) => {
      addWrappedText(`• ${ms.name}`, 12, true);
      addWrappedText(`Responsibility: ${ms.responsibility}`, 11);
      if (ms.techStack && ms.techStack.length > 0) {
        addWrappedText(`Tech Stack: ${ms.techStack.join(", ")}`, 11);
      }
      yPos += 3;
    });
    yPos += 5;
  }

  if (data.entities && data.entities.length > 0) {
    addWrappedText("Entities", 14, true);
    data.entities.forEach((entity) => {
      addWrappedText(`• ${entity.name}`, 12, true);
      const fields = Object.entries(entity.fields || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      addWrappedText(`Fields: ${fields}`, 11);
      yPos += 3;
    });
    yPos += 5;
  }

  if (data.apiRoutes && data.apiRoutes.length > 0) {
    addWrappedText("API Routes", 14, true);
    data.apiRoutes.forEach((api) => {
      addWrappedText(`Service: ${api.service}`, 12, true);
      if (api.routes) {
        api.routes.forEach((route) => {
          addWrappedText(`[${route.method}] ${route.path} - ${route.description}`, 11);
        });
      }
      yPos += 3;
    });
    yPos += 5;
  }

  if (data.infrastructure) {
    addWrappedText("Infrastructure", 14, true);
    const infra = data.infrastructure;
    addWrappedText(`Hosting: ${infra.hosting || "N/A"}`, 11);
    addWrappedText(`Database: ${infra.database || "N/A"}`, 11);
    addWrappedText(`Auth: ${infra.auth || "N/A"}`, 11);
    addWrappedText(`CDN: ${infra.cdn || "N/A"}`, 11);
    addWrappedText(`Scaling: ${infra.scaling || "N/A"}`, 11);
    yPos += 10;
  }

  if (diagramElementId) {
    const element = document.getElementById(diagramElementId);
    if (element) {
      try {
        const dataUrl = await htmlToImage.toPng(element, { 
          backgroundColor: "#ffffff",
          pixelRatio: 3, // Higher resolution scaling
          style: {
            padding: "20px",
            color: "#000000" // Ensure text is dark and readable
          }
        });
        const imgProps = doc.getImageProperties(dataUrl);
        
        // Calculate safe dimensions to avoid overflow and clipping
        const imgMargin = 10;
        const availableWidth = maxWidth - (imgMargin * 2);
        
        let pdfWidth = availableWidth;
        let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // If the scaled height exceeds a single page, scale it down to fit
        const maxAvailableHeight = pageHeight - margin * 2 - 20;
        if (pdfHeight > maxAvailableHeight) {
          pdfHeight = maxAvailableHeight;
          pdfWidth = (imgProps.width * pdfHeight) / imgProps.height;
        }

        checkPageBreak(pdfHeight + 15);
        addWrappedText("Architecture Diagram", 14, true);
        
        // Center the image horizontally
        const xOffset = margin + imgMargin + (availableWidth - pdfWidth) / 2;
        
        doc.addImage(dataUrl, "PNG", xOffset, yPos, pdfWidth, pdfHeight);
        yPos += pdfHeight + 10;
      } catch (err) {
        console.error("Failed to capture diagram image:", err);
      }
    }
  }

  doc.save("system-design.pdf");
};
