import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
import { ArchitectureData } from "./types";

interface PDFExportOptions {
  data: ArchitectureData;
  diagramElement?: HTMLElement | null;
}

const PDF_WIDTH = 210; // A4 width in mm
const PDF_HEIGHT = 297; // A4 height in mm
const MARGIN = 15; // margins in mm
const CONTENT_WIDTH = PDF_WIDTH - 2 * MARGIN;
const SMALL_FONT_SIZE = 10;
const NORMAL_FONT_SIZE = 11;
const TITLE_FONT_SIZE = 16;
const SECTION_FONT_SIZE = 14;

const generatePDF = async (options: PDFExportOptions): Promise<void> => {
  const { data, diagramElement } = options;
  const pdf = new jsPDF("p", "mm", "a4");

  let yPosition = MARGIN;

  const addPage = () => {
    pdf.addPage();
    yPosition = MARGIN;
  };

  const addText = (
    text: string,
    fontSize: number = NORMAL_FONT_SIZE,
    isBold: boolean = false,
  ) => {
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = pdf.splitTextToSize(text, CONTENT_WIDTH);
    const lineHeightVal = fontSize * 0.4; // approximately

    if (yPosition + lines.length * lineHeightVal > PDF_HEIGHT - MARGIN) {
      addPage();
    }

    pdf.text(lines, MARGIN, yPosition);
    yPosition += lines.length * lineHeightVal + 3;
  };

  const addSectionTitle = (title: string) => {
    if (yPosition + 15 > PDF_HEIGHT - MARGIN) {
      addPage();
    }
    pdf.setFontSize(SECTION_FONT_SIZE);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, MARGIN, yPosition);
    yPosition += 12;

    // Add a line separator
    pdf.setDrawColor(200, 200, 200);
    pdf.line(MARGIN, yPosition - 2, PDF_WIDTH - MARGIN, yPosition - 2);
    yPosition += 5;
  };

  const addTable = (
    headers: string[],
    rows: (string | number)[][],
    columnWidths?: number[],
  ) => {
    const defaultColWidth = CONTENT_WIDTH / headers.length;
    const colWidths = columnWidths || headers.map(() => defaultColWidth);

    // Check if we need a new page
    const tableHeight = (rows.length + 1) * 8;
    if (yPosition + tableHeight > PDF_HEIGHT - MARGIN) {
      addPage();
    }

    let xPos = MARGIN;
    const rowHeight = 8;

    // Draw header
    pdf.setFontSize(SMALL_FONT_SIZE);
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(240, 240, 240);

    headers.forEach((header, i) => {
      pdf.rect(xPos, yPosition, colWidths[i], rowHeight, "F");
      pdf.text(header, xPos + 2, yPosition + 5);
      xPos += colWidths[i];
    });

    yPosition += rowHeight;

    // Draw rows
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(SMALL_FONT_SIZE);
    rows.forEach((row) => {
      if (yPosition + rowHeight > PDF_HEIGHT - MARGIN) {
        addPage();
        xPos = MARGIN;
      }

      xPos = MARGIN;
      pdf.setDrawColor(220, 220, 220);
      row.forEach((cell, i) => {
        const cellText = String(cell);
        const lines = pdf.splitTextToSize(cellText, colWidths[i] - 2);
        const cellHeight = Math.max(rowHeight, lines.length * 5);

        if (yPosition + cellHeight > PDF_HEIGHT - MARGIN) {
          addPage();
          xPos = MARGIN;
        }

        pdf.rect(xPos, yPosition, colWidths[i], cellHeight);
        pdf.text(lines, xPos + 2, yPosition + 3);
        xPos += colWidths[i];
      });
      yPosition += rowHeight;
    });

    yPosition += 5;
  };

  // === TITLE PAGE ===
  pdf.setFontSize(TITLE_FONT_SIZE);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.systemName, MARGIN, yPosition);
  yPosition += 15;

  pdf.setFontSize(SMALL_FONT_SIZE);
  pdf.setFont("helvetica", "normal");
  addText(data.summary);
  yPosition += 10;

  // Add separator
  pdf.setDrawColor(100, 100, 100);
  pdf.line(MARGIN, yPosition, PDF_WIDTH - MARGIN, yPosition);
  yPosition += 10;

  // === MICROSERVICES SECTION ===
  if (data.microservices && data.microservices.length > 0) {
    addSectionTitle("Microservices");
    data.microservices.forEach((service) => {
      addText(`Service: ${service.name}`, NORMAL_FONT_SIZE, true);
      addText(`Responsibility: ${service.responsibility}`);
      addText(`Tech Stack: ${service.techStack.join(", ")}`);
      addText(`Workflow: ${service.details.workflow}`);
      if (service.details.inputs.length > 0) {
        addText(`Inputs: ${service.details.inputs.join(", ")}`);
      }
      if (service.details.outputs.length > 0) {
        addText(`Outputs: ${service.details.outputs.join(", ")}`);
      }
      yPosition += 5;
    });
  }

  // === CORE ENTITIES SECTION ===
  if (data.entities && data.entities.length > 0) {
    addSectionTitle("Core Entities");
    data.entities.forEach((entity) => {
      addText(`Entity: ${entity.name}`, NORMAL_FONT_SIZE, true);

      if (entity.fields && Object.keys(entity.fields).length > 0) {
        addText("Fields:", SMALL_FONT_SIZE, true);
        Object.entries(entity.fields).forEach(([fieldName, fieldType]) => {
          addText(`  • ${fieldName}: ${fieldType}`, SMALL_FONT_SIZE);
        });
      }

      if (entity.relations && Object.keys(entity.relations).length > 0) {
        addText("Relations:", SMALL_FONT_SIZE, true);
        Object.entries(entity.relations).forEach(([relName, relType]) => {
          addText(`  • ${relName}: ${relType}`, SMALL_FONT_SIZE);
        });
      }

      yPosition += 5;
    });
  }

  // === API ROUTES SECTION ===
  if (data.apiRoutes && data.apiRoutes.length > 0) {
    addSectionTitle("API Infrastructure");
    data.apiRoutes.forEach((routeGroup) => {
      addText(`Service: ${routeGroup.service}`, NORMAL_FONT_SIZE, true);

      routeGroup.routes.forEach((route) => {
        addText(`${route.method} ${route.path}`, SMALL_FONT_SIZE, true);
        addText(`Description: ${route.description}`, SMALL_FONT_SIZE);
        yPosition += 2;
      });

      yPosition += 5;
    });
  }

  // === DATABASE SCHEMA SECTION ===
  if (
    data.databaseSchema &&
    data.databaseSchema.collections &&
    data.databaseSchema.collections.length > 0
  ) {
    addSectionTitle("Database Architecture");
    addText(
      `Database Type: ${data.databaseSchema.type}`,
      NORMAL_FONT_SIZE,
      true,
    );
    yPosition += 3;

    data.databaseSchema.collections.forEach((collection) => {
      addText(`Collection: ${collection.name}`, NORMAL_FONT_SIZE, true);

      if (collection.fields && Object.keys(collection.fields).length > 0) {
        const headers = ["Field", "Type"];
        const rows = Object.entries(collection.fields).map(([name, type]) => [
          name,
          type,
        ]);
        addTable(headers, rows, [CONTENT_WIDTH * 0.4, CONTENT_WIDTH * 0.6]);
      }

      yPosition += 5;
    });
  }

  // === INFRASTRUCTURE SECTION ===
  if (
    data.infrastructure &&
    Object.values(data.infrastructure).some((v) => v !== "N/A")
  ) {
    addSectionTitle("Deployment & Infrastructure");

    const infraHeaders = ["Component", "Details"];
    const infraRows: (string | number)[][] = [
      ["Hosting", data.infrastructure.hosting],
      ["Database", data.infrastructure.database],
      ["Authentication", data.infrastructure.auth],
      ["CDN", data.infrastructure.cdn],
      ["Scaling", data.infrastructure.scaling],
    ];
    addTable(infraHeaders, infraRows, [
      CONTENT_WIDTH * 0.35,
      CONTENT_WIDTH * 0.65,
    ]);
  }

  // === ARCHITECTURE DIAGRAM SECTION ===
  if (diagramElement && data["Architecture Diagram"]) {
    addPage();
    addSectionTitle("Architecture Diagram");

    try {
      // Look for the rendered Mermaid SVG element inside the diagram element.
      // We specifically look for an SVG with an ID starting with 'mermaid-' to avoid
      // picking up Lucide icon SVGs or other buttons.
      const svgElement =
        diagramElement.querySelector("svg[id^='mermaid-']") ||
        diagramElement.querySelector("svg");

      const targetElement = (
        svgElement ? svgElement.parentElement || svgElement : diagramElement
      ) as HTMLElement;

      // Get the actual computed dimensions of the SVG element as rendered on the screen
      const rect = svgElement
        ? svgElement.getBoundingClientRect()
        : diagramElement.getBoundingClientRect();
      const computedWidth = rect.width || 800;
      const computedHeight = rect.height || 600;

      // Capture the element directly (no off-screen wrapper cloning, which causes blank exports)
      const diagramImage = await htmlToImage.toPng(targetElement, {
        backgroundColor: "#ffffff",
        pixelRatio: 3, // Crisp text and lines in PDF
        width: computedWidth + 40, // Include padding (20px each side)
        height: computedHeight + 40,
        style: {
          width: `${computedWidth}px`,
          height: `${computedHeight}px`,
          padding: "20px",
          background: "#ffffff",
          transform: "none",
          transformOrigin: "top left",
        },
      });

      const img = new Image();
      const imageLoaded = new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
      img.src = diagramImage;
      await imageLoaded;

      const width = img.width || 800;
      const height = img.height || 600;

      // Calculate dimensions to fit the diagram
      const maxDiagramWidth = CONTENT_WIDTH;
      const maxDiagramHeight = PDF_HEIGHT - 2 * MARGIN - 30; // Account for title and margins

      let diagramWidth = maxDiagramWidth;
      let diagramHeight = maxDiagramHeight;

      // Maintain aspect ratio
      const imgAspectRatio = width / height;
      const maxAspectRatio = maxDiagramWidth / maxDiagramHeight;

      if (imgAspectRatio > maxAspectRatio) {
        diagramHeight = diagramWidth / imgAspectRatio;
      } else {
        diagramWidth = diagramHeight * imgAspectRatio;
      }

      // Center the diagram
      const xOffset = MARGIN + (CONTENT_WIDTH - diagramWidth) / 2;

      pdf.addImage(
        diagramImage,
        "PNG",
        xOffset,
        yPosition,
        diagramWidth,
        diagramHeight,
      );
    } catch (error) {
      console.error("Failed to export diagram:", error);
      addText(
        "Note: Architecture diagram could not be rendered in this PDF.",
        SMALL_FONT_SIZE,
      );
    }
  }

  // Save the PDF
  const fileName = `${data.systemName.replace(/\s+/g, "-").toLowerCase()}-architecture.pdf`;
  pdf.save(fileName);
};

export default generatePDF;
