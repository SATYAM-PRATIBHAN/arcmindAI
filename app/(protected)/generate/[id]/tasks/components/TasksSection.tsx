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
  sectionIndex: number;
}

export default function TasksSection({
  category,
  tasks,
  allTasks,
  sectionIndex,
}: TasksSectionProps) {
  const totalHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            {sectionIndex.toString().padStart(2, "0")}
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{category}</h2>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} • {totalHours}{" "}
          hours
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} allTasks={allTasks} />
        ))}
      </div>
    </section>
  );
}
