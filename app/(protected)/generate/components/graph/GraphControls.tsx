// app/(protected)/generate/components/graph/GraphControls.tsx
"use client";

import React, { useState } from "react";
import {
  Grid,
  Flame,
  Activity,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  X,
} from "lucide-react";
import { GraphNode, GraphSubgraph } from "../../utils/parser";
import { nodeThemes } from "./GraphUtils";
import { SystemInsight } from "../../utils/insights";

interface GraphControlsProps {
  subgraphs: GraphSubgraph[];
  visibleLayers: Set<string>;
  toggleLayerVisibility: (layerId: string) => void;
  clearLayerFilters: () => void;
  heatmapMode: boolean;
  setHeatmapMode: (val: boolean) => void;
  isStoryMode: boolean;
  setIsStoryMode: (val: boolean) => void;
  showInsightsSidebar: boolean;
  setShowInsightsSidebar: (val: boolean) => void;
  activeSidebarTab: "specs" | "insights";
  setActiveSidebarTab: (val: "specs" | "insights") => void;
  setSelectedNodeId: (val: string | null) => void;
  setCurrentStepIndex: (val: number) => void;
  setIsPlaying: (val: boolean) => void;
  setSelectedInsight: (val: SystemInsight | null) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchResults: GraphNode[];
  centerOnNode: (id: string) => void;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  subgraphs,
  visibleLayers,
  toggleLayerVisibility,
  clearLayerFilters,
  heatmapMode,
  setHeatmapMode,
  isStoryMode,
  setIsStoryMode,
  showInsightsSidebar,
  setShowInsightsSidebar,
  activeSidebarTab,
  setActiveSidebarTab,
  setSelectedNodeId,
  setCurrentStepIndex,
  setIsPlaying,
  setSelectedInsight,
  handleZoomIn,
  handleZoomOut,
  handleResetZoom,
  searchQuery,
  setSearchQuery,
  searchResults,
  centerOnNode,
}) => {
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="absolute top-6 left-6 right-6 z-10 flex items-start justify-between pointer-events-none select-none">
      {/* Left Side Controls: Layer Filters, Heatmap, Story, Insights, Viewport */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        <div className="flex gap-2">
          {/* Multi-Layer Selector Dropdown */}
          {subgraphs.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowLayerDropdown(!showLayerDropdown)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide bg-slate-900/85 border border-white/10 backdrop-blur-md shadow-lg text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Layers Filters (
                  {visibleLayers.size > 0 ? visibleLayers.size : "All"})
                </span>
              </button>

              {showLayerDropdown && (
                <div className="absolute left-0 mt-2 w-[220px] rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl p-3 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Select Architecture Layers
                    </span>
                    {visibleLayers.size > 0 && (
                      <button
                        onClick={clearLayerFilters}
                        className="text-[9px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto">
                    {subgraphs.map((g) => {
                      const isChecked = visibleLayers.has(g.id);
                      return (
                        <label
                          key={g.id}
                          className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs text-slate-300 hover:text-white transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLayerVisibility(g.id)}
                            className="rounded border-white/10 bg-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="truncate">{g.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Heatmap/Complexity Map Toggle */}
          <button
            onClick={() => {
              setHeatmapMode(!heatmapMode);
              if (!heatmapMode) {
                setIsStoryMode(false);
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide bg-slate-900/85 border border-white/10 backdrop-blur-md shadow-lg transition-all cursor-pointer ${
              heatmapMode
                ? "bg-red-950/40 border-red-500/50 text-red-200"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
            title="Show Hotspot Complexity Map"
          >
            <Flame
              className={`w-3.5 h-3.5 ${heatmapMode ? "text-red-400 animate-pulse" : "text-slate-400"}`}
            />
            <span>Complexity Map</span>
          </button>

          {/* Story Mode Toggle */}
          <button
            onClick={() => {
              setIsStoryMode(!isStoryMode);
              if (!isStoryMode) {
                setHeatmapMode(false);
                setSelectedNodeId(null);
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }
              setShowInsightsSidebar(false);
              setSelectedInsight(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide bg-slate-900/85 border border-white/10 backdrop-blur-md shadow-lg transition-all cursor-pointer ${
              isStoryMode
                ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-200"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
            title="Interactive Scenario Walkthrough"
          >
            <Activity
              className={`w-3.5 h-3.5 ${isStoryMode ? "text-indigo-400 animate-pulse" : "text-slate-400"}`}
            />
            <span>Story Mode</span>
          </button>

          {/* Architecture Insights Toggle */}
          <button
            onClick={() => {
              const targetState = !showInsightsSidebar;
              setShowInsightsSidebar(targetState);
              if (targetState) {
                setActiveSidebarTab("insights");
                setHeatmapMode(false);
                setIsStoryMode(false);
                setIsPlaying(false);
              } else {
                setSelectedInsight(null);
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide bg-slate-900/85 border border-white/10 backdrop-blur-md shadow-lg transition-all cursor-pointer ${
              showInsightsSidebar && activeSidebarTab === "insights"
                ? "bg-rose-950/40 border-rose-500/50 text-rose-200"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
            title="System Architecture Insights"
          >
            <ShieldAlert
              className={`w-3.5 h-3.5 ${showInsightsSidebar && activeSidebarTab === "insights" ? "text-rose-400 animate-pulse" : "text-slate-400"}`}
            />
            <span>Insights Panel</span>
          </button>
        </div>

        {/* Viewport Operations */}
        <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-900/85 border border-white/10 backdrop-blur-md shadow-lg w-max">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title="Fit to Center"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Side Controls: Search Bar */}
      <div className="relative pointer-events-auto w-[240px]">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/85 border border-white/10 backdrop-blur-md shadow-lg transition-all focus-within:border-indigo-500/50">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full border-none p-0 focus:ring-0 focus:ring-offset-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search suggestions dropdown */}
        {isSearchFocused && searchQuery.trim() && searchResults.length > 0 && (
          <div className="absolute right-0 top-full mt-2 w-full rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl p-2 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-200 z-30">
            {searchResults.map((n) => {
              const theme = nodeThemes[n.type] || nodeThemes.component;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setSelectedNodeId(n.id);
                    setActiveSidebarTab("specs");
                    centerOnNode(n.id);
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-left transition-all cursor-pointer w-full"
                >
                  <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                    {theme.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate">
                      {n.label}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
                      {n.type}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default GraphControls;
