"use client";

import { Clock } from "lucide-react";

interface RateLimitBannerProps {
  secondsLeft: number;
  totalSeconds: number;
}

export function RateLimitBanner({
  secondsLeft,
  totalSeconds,
}: RateLimitBannerProps) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay =
    minutes > 0
      ? `${minutes}m ${seconds.toString().padStart(2, "0")}s`
      : `${seconds}s`;

  const progress =
    totalSeconds > 0
      ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100))
      : 0;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="relative w-full overflow-hidden rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Context */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Clock className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 truncate">
            Rate limit cooldown active
          </span>
        </div>

        {/* Right Side: High-contrast Countdown */}
        <span className="font-mono text-xs font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
          {timeDisplay}
        </span>
      </div>

      {/* Ultra-thin, low-profile progress bar aligned to the very bottom */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-neutral-100 dark:bg-neutral-900">
        <div
          className="h-full bg-amber-500 transition-all duration-1000 ease-linear dark:bg-amber-400"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
