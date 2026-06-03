"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { DiagramLayer } from "@/types/diagram";

// This context manages the state related to the diagram, such as selected nodes, search queries, active layers, and D3 visualization settings.
type DiagramContextType = {
  selectedNodeId: string | null;
  setSelectedNodeId: Dispatch<SetStateAction<string | null>>;

  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;

  activeLayers: DiagramLayer[];
  setActiveLayers: Dispatch<SetStateAction<DiagramLayer[]>>;

  isD3Enabled: boolean;
  setIsD3Enabled: Dispatch<SetStateAction<boolean>>;
};

// Create the context with an undefined default value. The provider will ensure that the context is properly initialized.
const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

// The provider component that wraps the application and provides the diagram state to its children.
export function DiagramProvider({ children }: { children: ReactNode }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [activeLayers, setActiveLayers] = useState<DiagramLayer[]>([]);

  const [isD3Enabled, setIsD3Enabled] = useState(false);

  return (
    <DiagramContext.Provider
      value={{
        selectedNodeId,
        setSelectedNodeId,

        searchQuery,
        setSearchQuery,

        activeLayers,
        setActiveLayers,

        isD3Enabled,
        setIsD3Enabled,
      }}
    >
      {children}
    </DiagramContext.Provider>
  );
}

// Custom hook to access the diagram context. It ensures that the context is used within a provider and provides type safety.
export function useDiagram() {
  const context = useContext(DiagramContext);

  if (!context) {
    throw new Error("useDiagram must be used within a DiagramProvider");
  }

  return context;
}
