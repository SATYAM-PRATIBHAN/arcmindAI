import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, Copy, Check, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  estimatedHours: number;
  dependencies: string[];
}

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  isSelected: boolean;
  onToggleSelected: (taskId: string, selected: boolean) => void;
  onCreateGithubIssue: (task: Task) => void;
  isGithubExporting: boolean;
  isGithubAvailable: boolean;
}

export default function TaskCard({
  task,
  allTasks,
  isSelected,
  onToggleSelected,
  onCreateGithubIssue,
  isGithubExporting,
  isGithubAvailable,
}: TaskCardProps) {
  const [copied, setCopied] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
      case "low":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getDependencyTitles = () => {
    return task.dependencies
      .map((depId) => {
        const depTask = allTasks.find((t) => t.id === depId);
        return depTask ? depTask.title : depId;
      })
      .join(", ");
  };

  const handleCopyTask = async () => {
    const priority =
      task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

    await navigator.clipboard.writeText(
      `[${priority}] ${task.title}: ${task.description}`,
    );

    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <Card className="border-border/60 hover:border-border/100 transition-all duration-300 shadow-none bg-card/30 backdrop-blur-sm group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                onToggleSelected(task.id, checked === true)
              }
              aria-label={`Select task ${task.title}`}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className={`${getPriorityColor(task.priority)} text-[10px] font-bold uppercase tracking-widest py-0 px-2`}
                >
                  {task.priority}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{task.estimatedHours}h</span>
                </div>
              </div>
              <CardTitle className="text-lg font-bold tracking-tight">
                {task.title}
              </CardTitle>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyTask}
              aria-label={copied ? "Task copied" : `Copy task ${task.title}`}
              title={copied ? "Copied" : "Copy task"}
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {task.description}
        </p>

        {task.dependencies.length > 0 && (
          <div className="pt-4 border-t border-border/40">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500/80" />
              Dependencies
            </p>
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {getDependencyTitles()}
            </p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onCreateGithubIssue(task)}
          disabled={isGithubExporting || !isGithubAvailable}
          className="w-full border-border/60 bg-card/50"
        >
          <Github className="h-4 w-4 mr-2" />
          Create GitHub Issue
        </Button>
      </CardContent>
    </Card>
  );
}
