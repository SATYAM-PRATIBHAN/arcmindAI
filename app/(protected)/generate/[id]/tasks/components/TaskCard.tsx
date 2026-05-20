import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";

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
}

export default function TaskCard({ task, allTasks }: TaskCardProps) {
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Backend:
        "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
      Frontend:
        "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
      Database:
        "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400",
      DevOps:
        "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400",
      Testing:
        "bg-pink-500/10 text-pink-700 border-pink-500/20 dark:text-pink-400",
      Documentation:
        "bg-teal-500/10 text-teal-700 border-teal-500/20 dark:text-teal-400",
      Security: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return colors[category] || "bg-muted text-muted-foreground border-border";
  };

  const getDependencyTitles = () => {
    return task.dependencies
      .map((depId) => {
        const depTask = allTasks.find((t) => t.id === depId);
        return depTask ? depTask.title : depId;
      })
      .join(", ");
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={getCategoryColor(task.category)}
              >
                {task.category}
              </Badge>
              <Badge
                variant="outline"
                className={getPriorityColor(task.priority)}
              >
                {task.priority}
              </Badge>
            </div>
            <CardTitle className="text-lg">{task.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
            <Clock className="h-4 w-4" />
            <span>{task.estimatedHours}h</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
          {task.description}
        </p>

        {task.dependencies.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-foreground">
                Dependencies:{" "}
              </span>
              <span className="text-muted-foreground">
                {getDependencyTitles()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
