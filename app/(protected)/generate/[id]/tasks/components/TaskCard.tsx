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
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Backend: "bg-blue-100 text-blue-800",
      Frontend: "bg-purple-100 text-purple-800",
      Database: "bg-indigo-100 text-indigo-800",
      DevOps: "bg-orange-100 text-orange-800",
      Testing: "bg-pink-100 text-pink-800",
      Documentation: "bg-teal-100 text-teal-800",
      Security: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
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
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{task.estimatedHours}h</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-3">{task.description}</p>

        {task.dependencies.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-amber-900">Dependencies:</span>
              <span className="text-gray-600 ml-1">
                {getDependencyTitles()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
