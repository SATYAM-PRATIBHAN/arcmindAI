# Milestone: Interactive D3 System Design Diagrams

## Overview

This milestone aims to replace the current static Mermaid.js-based architecture diagrams with a fully interactive, D3.js-powered visualization engine. The new system will support deep-dive analysis, layer filtering, dependency tracking, and a "Story Mode" for architectural walkthroughs.

---

## 🗺️ The 15-Issue Roadmap

### 🏗️ Stream 1: Data & Infrastructure (The Foundation)

1. **[DIAG-01] Define D3 TypeScript Interfaces**
   - **Goal:** Create a unified data model for the graph.
   - **File:** `types/diagram.ts`
2. **[DIAG-02] Implement Mermaid-to-JSON Parser Logic**
   - **Goal:** Convert existing AI Mermaid strings into the new JSON schema.
   - **File:** `lib/utils/diagram-parser.ts`
3. **[DIAG-03] Integrate Parser into Frontend Hooks (Client-Side)**
   - **Goal:** Run the parser on the frontend whenever a new Mermaid string is generated, storing the JSON in React state.
   - **Note:** Do NOT replace the existing Mermaid viewer yet. Run this logic in the background to prepare data for the upcoming D3 canvas.
4. **[DIAG-04] Create Diagram State Provider (React Context)**
   - **Goal:** Manage global diagram state (selection, filtering, search).
   - **File:** `context/DiagramContext.tsx`

### 🎨 Stream 2: Core Rendering Engine (The Canvas)

5. **[DIAG-05] Setup D3 SVG Canvas & Responsive Wrapper**
   - **Goal:** Implement the base component that scales to parent containers.
   - **Note:** Render this component below the existing Mermaid diagram (or hidden behind a dev toggle) to ensure no disruption to current users.
6. **[DIAG-06] Implement D3 Force-Directed Simulation**
   - **Goal:** Physics-based layout for nodes and links.
7. **[DIAG-07] Implement Zoom, Pan, and Reset UI**
   - **Goal:** User navigation controls (Mouse wheel + UI buttons).
8. **[DIAG-08] Draw Basic Node & Link Primitives**
   - **Goal:** Initial rendering of shapes and lines bound to data.

### 🔍 Stream 3: Navigation & Search (The Discovery)

9. **[DIAG-09] Build Search Input Component UI**
   - **Goal:** Floating search bar on the diagram canvas.
10. **[DIAG-10] Implement Node Highlighting Logic**
    - **Goal:** Visually isolate nodes based on search or selection.
11. **[DIAG-11] Implement Layer/Category Filtering Toggles**
    - **Goal:** Toggle groups of nodes (e.g., "Database", "API").

### 🧠 Stream 4: Intelligence & Insights (The Brain)

12. **[DIAG-12] Build the Insight Panel (Sheet/Drawer)**
    - **Goal:** Side-panel for detailed node information.
13. **[DIAG-13] Implement Dependency Analysis Logic**
    - **Goal:** Highlight upstream/downstream connections on click.
14. **[DIAG-14] Implement Severity/Criticality Visuals**
    - **Goal:** Color nodes by impact (dependency count).

### ✨ Stream 5: Experience & Polish (The "Wow" Factor)

15. **[DIAG-15] Implement "Story Mode" Sequential Stepper**
    - **Goal:** Sequential walkthrough of architectural flows.

---

## 🛠️ Contributor Guidelines

- Each issue should be worked on in a separate branch: `feat/diag-[id]`.
- Ensure all D3 logic is modular and doesn't break the Mermaid fallback.
- Add unit tests for the parser and dependency logic.
