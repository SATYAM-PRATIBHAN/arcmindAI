"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DiagramNode } from "@/types/diagram";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InsightPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: DiagramNode | null;
}

function getSeverityVariant(
  severity: DiagramNode["severity"],
): "default" | "secondary" | "destructive" {
  switch (severity) {
    case "Critical":
      return "destructive";

    case "High":
      return "default";

    case "Medium":
    case "Low":
    default:
      return "secondary";
  }
}

export default function InsightPanel({
  open,
  onOpenChange,
  node,
}: InsightPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={cn(
            "absolute right-4 top-4 bottom-4 w-80 md:w-96 z-20 flex flex-col rounded-xl",
            "border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl",
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Insight Panel
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close panel</span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 rounded-b-xl">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  Architecture Insight
                </p>

                <h2 className="text-2xl font-bold leading-tight">
                  {node?.label ?? "System Component"}
                </h2>
              </div>

              {node && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">{node.type}</Badge>

                  <Badge variant="secondary">{node.layer}</Badge>

                  <Badge variant={getSeverityVariant(node.severity)}>
                    {node.severity} Severity
                  </Badge>
                </div>
              )}
            </div>

            {node && (
              <div className="space-y-5">
                {/* Overview */}
                {node.description && (
                  <div className="rounded-xl border border-border/50 bg-card/40 p-5 space-y-3 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Overview
                    </h3>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {node.description ||
                        "No architectural description available for this component."}
                    </p>
                  </div>
                )}

                {/* Architecture Metadata */}
                <div className="rounded-xl border border-border/50 bg-card/40 p-5 space-y-4 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Architecture Metadata
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Node ID
                      </p>

                      <p className="font-mono text-sm break-all">{node.id}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Shape
                      </p>

                      <p className="text-sm capitalize">{node.shape}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Layer
                      </p>

                      <p className="text-sm">{node.layer}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Component Type
                      </p>

                      <p className="text-sm">{node.type}</p>
                    </div>

                    {node.subgraphTitle && (
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Subgraph
                        </p>

                        <p className="text-sm">{node.subgraphTitle}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* System Classification */}
                <div className="rounded-xl border border-border/50 bg-card/40 p-5 space-y-3 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    System Classification
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{node.shape}</Badge>

                    <Badge variant="outline">{node.layer}</Badge>

                    <Badge variant="outline">{node.type}</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
