"use client";

import { ChevronLeft, ChevronRight, Route, X } from "lucide-react";

interface WalkthroughControlsProps {
  active: boolean;
  /** Index of the current step (0-based). */
  index: number;
  /** Total number of steps. */
  total: number;
  onStart: () => void;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}

/**
 * Floating controls for the guided architecture walkthrough.
 */
export default function WalkthroughControls({
  active,
  index,
  total,
  onStart,
  onPrev,
  onNext,
  onExit,
}: WalkthroughControlsProps) {
  if (total < 2) return null;

  if (!active) {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-[#0f172a]/80 backdrop-blur px-4 py-2 text-xs font-medium text-slate-300 shadow-lg hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          aria-label="Start guided tour"
          title="Start guided tour"
        >
          <Route className="w-4 h-4" />
          Guided Tour
        </button>
      </div>
    );
  }

  const isFirst = index <= 0;
  const isLast = index >= total - 1;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-fit">
      <div className="flex w-fit items-center gap-2 rounded-2xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur p-2 shadow-lg">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Previous step"
          title="Previous step"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="shrink-0 px-1 text-center">
          <div className="whitespace-nowrap text-xs uppercase text-slate-300 tracking-widest">
            Step {index + 1} / {total}
          </div>
        </div>

        <button
          type="button"
          onClick={isLast ? onExit : onNext}
          className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          aria-label={isLast ? "Finish tour" : "Next step"}
          title={isLast ? "Finish tour" : "Next step"}
        >
          {isLast ? "Finish" : "Next"}
          {!isLast && <ChevronRight className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onExit}
          className="flex shrink-0 items-center rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          aria-label="Exit tour"
          title="Exit tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
