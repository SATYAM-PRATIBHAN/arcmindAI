// app/(protected)/generate/components/graph/StoryPlaybook.tsx
"use client";

import React from "react";
import {
  Activity,
  X,
  SkipBack,
  ChevronLeft,
  Pause,
  Play,
  ChevronRight,
  SkipForward,
} from "lucide-react";

export interface ScenarioStep {
  nodeId: string;
  title: string;
  description: string;
}

export interface Scenario {
  name: string;
  description: string;
  steps: ScenarioStep[];
}

interface StoryPlaybookProps {
  isStoryMode: boolean;
  setIsStoryMode: (val: boolean) => void;
  scenarios: Scenario[];
  currentScenarioIndex: number;
  setCurrentScenarioIndex: (val: number) => void;
  currentStepIndex: number;
  setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
}

export const StoryPlaybook: React.FC<StoryPlaybookProps> = ({
  isStoryMode,
  setIsStoryMode,
  scenarios,
  currentScenarioIndex,
  setCurrentScenarioIndex,
  currentStepIndex,
  setCurrentStepIndex,
  isPlaying,
  setIsPlaying,
}) => {
  if (
    !isStoryMode ||
    scenarios.length === 0 ||
    !scenarios[currentScenarioIndex]
  ) {
    return null;
  }

  const scenario = scenarios[currentScenarioIndex];
  const stepsCount = scenario.steps.length;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[460px] rounded-2xl bg-slate-955/90 border border-white/10 backdrop-blur-xl shadow-2xl p-4 flex flex-col gap-3.5 z-20 pointer-events-auto transition-all animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Story Playback Engine
          </span>
        </div>
        <button
          onClick={() => {
            setIsStoryMode(false);
            setIsPlaying(false);
          }}
          className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          title="Exit Story Mode"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scenario Selector Dropdown */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          Select Playbook Scenario
        </span>
        <select
          value={currentScenarioIndex}
          onChange={(e) => {
            setCurrentScenarioIndex(Number(e.target.value));
            setCurrentStepIndex(0);
            setIsPlaying(false);
          }}
          className="bg-slate-900 border border-white/10 text-[11px] text-slate-300 rounded-lg p-2 focus:outline-none focus:border-indigo-500/50 w-full cursor-pointer hover:bg-slate-800 transition-all font-medium"
        >
          {scenarios.map((scen, idx) => (
            <option key={idx} value={idx}>
              {scen.name}
            </option>
          ))}
        </select>
      </div>

      {/* Commentary / Narration Box */}
      <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5 space-y-1 min-h-[75px] flex flex-col justify-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
          {scenario.steps[currentStepIndex]?.title || "Walkthrough Step"}
        </span>
        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
          {scenario.steps[currentStepIndex]?.description}
        </p>
      </div>

      {/* Step Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-mono font-bold text-slate-500 shrink-0">
          Step {currentStepIndex + 1} of {stepsCount}
        </span>
        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            style={{ width: `${((currentStepIndex + 1) / stepsCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Playback Control Buttons */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <button
          onClick={() => {
            setCurrentStepIndex(0);
            setIsPlaying(false);
          }}
          disabled={currentStepIndex === 0}
          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
          title="Reset to Start"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            setCurrentStepIndex((prev) => Math.max(0, prev - 1));
            setIsPlaying(false);
          }}
          disabled={currentStepIndex === 0}
          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
          title="Previous Step"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2.5 rounded-full bg-indigo-600 border border-indigo-500 hover:bg-indigo-500 text-white transition-all shadow-[0_0_12px_rgba(99,102,241,0.4)]"
          title={isPlaying ? "Pause Autoplay" : "Play Autoplay"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => {
            setCurrentStepIndex((prev) =>
              prev < stepsCount - 1 ? prev + 1 : prev,
            );
            setIsPlaying(false);
          }}
          disabled={currentStepIndex === stepsCount - 1}
          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
          title="Next Step"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            setCurrentStepIndex(stepsCount - 1);
            setIsPlaying(false);
          }}
          disabled={currentStepIndex === stepsCount - 1}
          className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
          title="Skip to End"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
export default StoryPlaybook;
