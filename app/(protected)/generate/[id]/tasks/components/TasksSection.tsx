import TaskCard from "./TaskCard";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  estimatedHours: number;
  dependencies: string[];
}

interface TasksSectionProps {
  category: string;
  tasks: Task[];
  allTasks: Task[];
}

export default function TasksSection({
  category,
  tasks,
  allTasks,
}: TasksSectionProps) {
  const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{category}</h2>
        <div className="text-sm text-gray-600">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} • {totalHours}{" "}
          hours
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} allTasks={allTasks} />
        ))}
      </div>
    </div>
  );
}
