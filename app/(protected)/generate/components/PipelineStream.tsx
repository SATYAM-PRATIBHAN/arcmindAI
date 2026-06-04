import Lottie from "lottie-react";
import animationData from "@/components/loaderLottie.json";

interface PipelineStreamProps {
  currentStage: number;
  streamingProgress: string;
  terminalRef: React.RefObject<HTMLDivElement | null>;
}

export function PipelineStream({ currentStage, streamingProgress, terminalRef }: PipelineStreamProps) {
  return (
    <div className="w-full max-w-5xl mx-auto py-16 px-8 animate-in fade-in duration-700">
      {/* Upper Section: Formal Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 mb-8 border-b border-border/60 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
              System Generation Protocol
            </p>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Synthesizing Architecture Canvas
          </h2>
        </div>

        {/* Enterprise Status Metadata */}
        <div className="flex items-center gap-6 font-mono text-[11px] text-muted-foreground/70">
          <div className="hidden sm:block">
            <span className="text-muted-foreground/40 block text-[9px] uppercase tracking-wider">
              Engine
            </span>
            <span className="font-medium text-foreground">
              v4.12.0-core
            </span>
          </div>
          <div className="h-6 w-px bg-border/60"></div>
          <div>
            <span className="text-muted-foreground/40 block text-[9px] uppercase tracking-wider">
              Payload
            </span>
            <span className="font-medium text-foreground">
              {streamingProgress.length
                ? `${streamingProgress.length} Chars`
                : "0 Chars"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Architectural Body Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-border/80 rounded-lg overflow-hidden bg-card/10 shadow-sm">
        {/* Left Column: Dynamic Progress Sidebar */}
        <div className="p-8 flex flex-col justify-between bg-muted/20 md:border-r border-border/60">
          <div className="space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Pipeline Stages
            </h3>

            <nav className="space-y-4 font-mono text-xs">
              {/* Stage 1 */}
              <div
                className={`flex items-center gap-3 transition-colors duration-300 ${currentStage === 0 ? "text-foreground font-medium" : currentStage > 0 ? "text-muted-foreground/50" : "text-muted-foreground/30"}`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold transition-all ${currentStage > 0 ? "bg-primary/5 border-primary/30 text-primary" : "bg-background border-primary/60 animate-pulse"}`}
                >
                  {currentStage > 0 ? "✓" : "→"}
                </div>
                <span>01. Schema Ingestion</span>
              </div>

              {/* Stage 2 */}
              <div
                className={`flex items-center gap-3 transition-colors duration-300 ${currentStage === 1 ? "text-foreground font-medium" : currentStage > 1 ? "text-muted-foreground/50" : "text-muted-foreground/30"}`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold transition-all ${currentStage > 1 ? "bg-primary/5 border-primary/30 text-primary" : currentStage === 1 ? "bg-background border-primary/60 animate-pulse text-primary" : "border-border bg-background/50"}`}
                >
                  {currentStage > 1 ? "✓" : currentStage === 1 ? "→" : ""}
                </div>
                <span>02. Entity Clustering</span>
              </div>

              {/* Stage 3 */}
              <div
                className={`flex items-center gap-3 transition-colors duration-300 ${currentStage === 2 ? "text-foreground font-medium" : "text-muted-foreground/30"}`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] font-bold transition-all ${currentStage === 2 ? "bg-background border-primary/60 animate-pulse text-primary" : "border-dashed border-border bg-background/50"}`}
                >
                  {currentStage === 2 ? "→" : ""}
                </div>
                <span>03. Infrastructure Compilation</span>
              </div>
            </nav>
          </div>

          {/* Minimal Animated Geometric Indicator */}
          <div className="pt-8 mt-8 border-t border-border/40 hidden md:flex items-center gap-4">
            <div className="opacity-40 scale-75 origin-left mix-blend-luminosity">
              <Lottie
                animationData={animationData}
                loop={true}
                style={{ width: 50, height: 50 }}
              />
            </div>
            <p className="text-[10px] font-mono text-muted-foreground/50 leading-tight uppercase tracking-wider">
              {currentStage === 0 && "Parsing incoming payload..."}
              {currentStage === 1 && "Mapping model nodes..."}
              {currentStage === 2 && "Compiling cloud templates..."}
            </p>
          </div>
        </div>

        {/* Premium Dark Right Column: The Formatted Technical Stream */}
        <div className="md:col-span-2 bg-zinc-950 p-8 flex flex-col justify-between min-h-[360px] text-zinc-100">
          {/* Stream Dynamic Window */}
          <div className="relative flex-1">
            {streamingProgress ? (
              <div
                ref={terminalRef}
                className="absolute inset-0 overflow-y-auto font-mono text-[11px] leading-6 scrollbar-none select-text"
              >
                {/* Header/File Signature inside the premium stream block */}
                <div className="text-zinc-500 text-[10px] uppercase tracking-wider select-none pb-3 border-b border-zinc-900/80 mb-4 flex items-center justify-between">
                  <span>{"//"} core_synthesis_engine.log</span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] lowercase animate-pulse">
                    live compile
                  </span>
                </div>

                {/* Code-like Output Container */}
                <div className="space-y-1 font-mono tracking-normal text-zinc-300">
                  {streamingProgress.split("\n").map((line, index) => {
                    if (!line.trim() && index !== 0) return null;

                    // Smart Premium Color Modifiers based on content
                    const isError =
                      line.toLowerCase().includes("error") ||
                      line.toLowerCase().includes("fail");
                    const isSuccess =
                      line.toLowerCase().includes("success") ||
                      line.toLowerCase().includes("complete") ||
                      line.includes("✓");
                    const isConfig =
                      line.includes(">>") ||
                      line.includes("{") ||
                      line.includes("}");

                    return (
                      <div
                        key={index}
                        className="flex items-start gap-4 hover:bg-zinc-900/40 px-2 py-0.5 rounded transition-colors group"
                      >
                        {/* Static Clean Line Numbering */}
                        <span className="text-zinc-700 text-right select-none w-5 text-[10px] pt-0.5 font-light group-hover:text-zinc-500">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        {/* Clean Line Parsing */}
                        <p
                          className={`flex-1 whitespace-pre-wrap break-all ${
                            isError
                              ? "text-rose-400 font-medium"
                              : isSuccess
                                ? "text-emerald-400 font-medium"
                                : isConfig
                                  ? "text-sky-400/90"
                                  : "text-zinc-300"
                          }`}
                        >
                          {line}
                        </p>
                      </div>
                    );
                  })}

                  {/* Inline tracking cursor at the true termination point of text */}
                  <div className="flex items-start gap-4 px-2 pt-0.5">
                    <span className="text-zinc-700 select-none w-5 text-[10px] font-light">
                      {String(
                        streamingProgress.split("\n").filter(Boolean)
                          .length + 1,
                      ).padStart(2, "0")}
                    </span>
                    <span className="inline-block w-1.5 h-4 bg-primary/80 animate-pulse opacity-90 align-middle" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center gap-3 text-center py-12">
                <div className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary/80 animate-spin" />
                <p className="font-mono text-xs text-zinc-500 tracking-tight">
                  Awaiting output buffer generation sequence...
                </p>
              </div>
            )}
          </div>

          {/* Stream Bottom Metadata Bar */}
          <div className="mt-6 pt-4 border-t border-zinc-900/80 flex items-center justify-between font-mono text-[10px] text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sandbox Cloud Cluster</span>
            </div>
            <span>TLS Secure Feed</span>
          </div>
        </div>
      </div>

      {/* Undertext: Strict Corporate Footnote */}
      <p className="text-center text-muted-foreground/40 text-[11px] mt-6 tracking-wide font-light">
        System creation typically requires 15 to 30 seconds depending on
        relational constraints.
      </p>
    </div>
  );
}
