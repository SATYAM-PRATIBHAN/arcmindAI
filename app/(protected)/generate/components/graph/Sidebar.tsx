// app/(protected)/generate/components/graph/Sidebar.tsx
"use client";

import React, { useMemo } from "react";
import {
  X,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
} from "lucide-react";
import { GraphNode, GraphSubgraph } from "../../utils/parser";
import { ArchitectureData } from "../../utils/types";
import { nodeThemes } from "./GraphUtils";
import { SystemInsight, HealthScoreInfo } from "../../utils/insights";

interface SidebarProps {
  showInsightsSidebar: boolean;
  setShowInsightsSidebar: (val: boolean) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (val: string | null) => void;
  activeSidebarTab: "specs" | "insights";
  setActiveSidebarTab: (val: "specs" | "insights") => void;
  traceDirection: "none" | "upstream" | "downstream" | "full";
  setTraceDirection: (val: "none" | "upstream" | "downstream" | "full") => void;
  criticalNodes: Set<string>;
  nodeDegrees: Record<string, number>;
  subgraphs: GraphSubgraph[];
  systemInsights: SystemInsight[];
  healthScoreInfo: HealthScoreInfo;
  selectedInsight: SystemInsight | null;
  setSelectedInsight: (val: SystemInsight | null) => void;
  centerOnNode: (id: string) => void;
  nodes: GraphNode[];
  generatedData: ArchitectureData | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  showInsightsSidebar,
  setShowInsightsSidebar,
  selectedNodeId,
  setSelectedNodeId,
  activeSidebarTab,
  setActiveSidebarTab,
  traceDirection,
  setTraceDirection,
  criticalNodes,
  nodeDegrees,
  subgraphs,
  systemInsights,
  healthScoreInfo,
  selectedInsight,
  setSelectedInsight,
  centerOnNode,
  nodes,
  generatedData,
}) => {
  // Selected Node specifications lookup
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNodeId || !generatedData) return null;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;

    if (node.type === "service") {
      const ms = generatedData.microservices?.find(
        (m) =>
          m.name.toLowerCase().includes(node.label.toLowerCase()) ||
          node.label.toLowerCase().includes(m.name.toLowerCase()),
      );
      if (ms) return { type: "microservice", node, data: ms };
    }

    if (node.type === "database") {
      const dbInfo = generatedData.databaseSchema;
      return { type: "database", node, data: dbInfo };
    }

    return { type: "general", node, data: node };
  }, [selectedNodeId, generatedData, nodes]);

  const msData =
    selectedNodeDetails?.type === "microservice"
      ? (selectedNodeDetails.data as NonNullable<
          ArchitectureData["microservices"]
        >[number])
      : null;

  const dbData =
    selectedNodeDetails?.type === "database"
      ? (selectedNodeDetails.data as NonNullable<
          ArchitectureData["databaseSchema"]
        >)
      : null;

  const handleSelectInsight = (insight: SystemInsight) => {
    if (selectedInsight?.id === insight.id) {
      setSelectedInsight(null);
    } else {
      setSelectedInsight(insight);
      if (insight.affectedNodes.length > 0) {
        centerOnNode(insight.affectedNodes[0]);
      }
    }
  };

  // Determine if we should display the sidebar
  const isVisible = showInsightsSidebar || selectedNodeId;
  if (!isVisible) return null;

  return (
    <div className="w-[320px] h-full z-10 border-l border-white/10 bg-slate-955/70 backdrop-blur-xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 select-none">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between pb-4">
        {activeSidebarTab === "specs" && selectedNodeDetails ? (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              {
                (
                  nodeThemes[selectedNodeDetails.node.type] ||
                  nodeThemes.component
                ).icon
              }
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white tracking-wide truncate max-w-[180px]">
                {selectedNodeDetails.node.label}
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {selectedNodeDetails.node.type} Node
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/10">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white tracking-wide truncate">
                System Insights
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500/80">
                AI Architecture Analysis
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            setSelectedNodeId(null);
            setShowInsightsSidebar(false);
            setSelectedInsight(null);
          }}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="px-5 pb-3 pt-2 border-b border-white/5">
        <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            onClick={() => {
              if (selectedNodeId) {
                setActiveSidebarTab("specs");
              }
            }}
            disabled={!selectedNodeId}
            className={`py-2 px-3 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
              activeSidebarTab === "specs"
                ? "bg-indigo-600/90 text-white shadow-lg backdrop-blur-md"
                : "text-slate-400 hover:text-slate-200 disabled:opacity-20 disabled:pointer-events-none"
            }`}
          >
            Specs
          </button>
          <button
            onClick={() => setActiveSidebarTab("insights")}
            className={`py-2 px-3 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
              activeSidebarTab === "insights"
                ? "bg-indigo-600/90 text-white shadow-lg backdrop-blur-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Insights
          </button>
        </div>
      </div>

      {/* Details Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-800">
        {activeSidebarTab === "specs" && selectedNodeDetails ? (
          <div className="space-y-6">
            {/* Dependency Tracing Buttons Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Dependency Tracing
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                <button
                  onClick={() => setTraceDirection("upstream")}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[9px] font-semibold transition-all cursor-pointer ${
                    traceDirection === "upstream"
                      ? "bg-red-500/25 border border-red-500/35 text-red-200"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                  title="Trace Upstream (Dependencies)"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
                  <span>Upstream</span>
                </button>
                <button
                  onClick={() => setTraceDirection("downstream")}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[9px] font-semibold transition-all cursor-pointer ${
                    traceDirection === "downstream"
                      ? "bg-cyan-500/25 border border-cyan-500/35 text-cyan-200"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                  title="Trace Downstream (Dependents)"
                >
                  <ArrowDownRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Downstream</span>
                </button>
                <button
                  onClick={() => setTraceDirection("full")}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[9px] font-semibold transition-all cursor-pointer ${
                    traceDirection === "full"
                      ? "bg-indigo-500/25 border border-indigo-500/35 text-indigo-200"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                  title="Trace Both Directions"
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Full Path</span>
                </button>
              </div>
            </div>

            {/* Critical service bottleneck warning alert box */}
            {selectedNodeId && criticalNodes.has(selectedNodeId) && (
              <div className="flex gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                <div className="space-y-0.5">
                  <span className="font-bold">
                    High Density Hotspot Warning
                  </span>
                  <p className="text-[10px] text-amber-400/80 leading-relaxed">
                    This node has high structural centrality (
                    {nodeDegrees[selectedNodeId]} connections). Changes to this
                    service may create cascading architectural failures.
                  </p>
                </div>
              </div>
            )}

            {/* Placement Layer */}
            {selectedNodeDetails.node.parentId && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Placement Layer
                </span>
                <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 rounded-lg">
                  <Layers className="w-3.5 h-3.5" />
                  {subgraphs.find(
                    (s) => s.id === selectedNodeDetails.node.parentId,
                  )?.label || selectedNodeDetails.node.parentId}
                </div>
              </div>
            )}

            {/* Microservice Structured Details */}
            {selectedNodeDetails.type === "microservice" && msData && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Core Responsibility
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-2.5 rounded-lg">
                    {msData.responsibility}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Technology Stack
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msData.techStack?.map((tech: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold text-slate-300 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Service Details Workflow */}
                {msData.details && (
                  <>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Execution Workflow
                      </span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {msData.details.workflow}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          Inputs
                        </span>
                        <ul className="text-[10px] text-slate-400 list-disc list-inside">
                          {msData.details.inputs?.map(
                            (inp: string, i: number) => (
                              <li key={i} className="truncate">
                                {inp}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          Outputs
                        </span>
                        <ul className="text-[10px] text-slate-400 list-disc list-inside">
                          {msData.details.outputs?.map(
                            (out: string, i: number) => (
                              <li key={i} className="truncate">
                                {out}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Database Structured Details */}
            {selectedNodeDetails.type === "database" && dbData && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Database Type
                  </span>
                  <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                    <Activity className="w-3.5 h-3.5" />
                    {dbData.type}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Collections / Tables
                  </span>
                  <div className="space-y-2">
                    {dbData.collections?.map((col, i: number) => (
                      <div
                        key={i}
                        className="bg-white/5 border border-white/5 p-2 rounded-lg space-y-1"
                      >
                        <span className="text-[10px] font-bold text-slate-300 block">
                          {col.name}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(col.fields || {}).map(
                            ([field, type], fIdx) => (
                              <span
                                key={fIdx}
                                className="text-[8px] font-mono text-slate-400 bg-black/30 px-1 py-0.5 rounded"
                              >
                                {field}: {type}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeSidebarTab === "insights" ? (
          <div className="space-y-6">
            {/* System Health Section */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="stroke-white/10"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke={healthScoreInfo.strokeColor}
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="201.06"
                    strokeDashoffset={
                      201.06 * (1 - healthScoreInfo.score / 100)
                    }
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={`text-xl font-black ${healthScoreInfo.colorClass}`}
                  >
                    {healthScoreInfo.grade}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {healthScoreInfo.score}%
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  System Health
                </span>
                <h4 className="text-xs font-bold text-slate-200 mt-0.5 truncate">
                  {healthScoreInfo.gradeDesc}
                </h4>
                <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                  Based on {systemInsights.length} detected vulnerabilities.
                </p>
              </div>
            </div>

            {/* Vulnerabilities Accordion/List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Detected Issues ({systemInsights.length})
                </span>
              </div>

              {systemInsights.length === 0 ? (
                <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/5 text-slate-400 text-xs">
                  No design vulnerabilities detected! Your architecture looks
                  clean and optimal.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {systemInsights.map((insight) => {
                    const isSelected = selectedInsight?.id === insight.id;
                    let severityColor =
                      "border-cyan-500/20 bg-cyan-950/10 text-cyan-400";
                    let badgeColor = "bg-cyan-500/10 text-cyan-300";
                    let activeBorder = "border-cyan-500";

                    if (insight.severity === "critical") {
                      severityColor =
                        "border-red-500/25 bg-red-950/10 text-red-400";
                      badgeColor = "bg-red-500/10 text-red-300";
                      activeBorder = "border-red-500";
                    } else if (insight.severity === "warning") {
                      severityColor =
                        "border-amber-500/25 bg-amber-950/10 text-amber-400";
                      badgeColor = "bg-amber-500/10 text-amber-300";
                      activeBorder = "border-amber-500";
                    }

                    return (
                      <div
                        key={insight.id}
                        onClick={() => handleSelectInsight(insight)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? `${activeBorder} bg-slate-900/60 shadow-[0_0_12px_rgba(99,102,241,0.15)]`
                            : `${severityColor} hover:bg-slate-900/40`
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-xs font-bold text-slate-200">
                              {insight.title}
                            </span>
                          </div>
                          <span
                            className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${badgeColor}`}
                          >
                            {insight.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                          {insight.description}
                        </p>
                        {insight.affectedNodes.length > 0 && isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-white/5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                              Affected Components:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {insight.affectedNodes.map((nodeId) => {
                                const label =
                                  nodes.find((n) => n.id === nodeId)?.label ||
                                  nodeId;
                                return (
                                  <span
                                    key={nodeId}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      centerOnNode(nodeId);
                                    }}
                                    className="text-[9px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                  >
                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-slate-400 text-xs">
            Select a component or open system insights.
          </div>
        )}
      </div>
    </div>
  );
};
export default Sidebar;
