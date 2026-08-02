import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@workspace/api-client-react/src/generated/api.schemas";

interface TaskItemProps {
  task: Task;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
  index: number;
}

export function TaskItem({ task, onToggle, onDelete, index }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => onDelete(task.id), 200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: isDeleting ? 0 : 1, 
        y: isDeleting ? -10 : 0,
        scale: isDeleting ? 0.95 : 1
      }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ 
        duration: 0.2, 
        delay: index * 0.03,
        ease: [0.23, 1, 0.32, 1]
      }}
      className="group"
      data-testid={`task-item-${task.id}`}
    >
      <div className="flex items-center gap-3 p-4 bg-card border border-card-border rounded-xl hover:shadow-sm transition-all duration-200">
        <Checkbox
          checked={task.done}
          onCheckedChange={(checked) => onToggle(task.id, checked as boolean)}
          className="w-5 h-5 rounded-md transition-all duration-200"
          data-testid={`checkbox-task-${task.id}`}
        />
        
        <motion.span
          className={`flex-1 text-[15px] transition-all duration-300 ${
            task.done
              ? "text-muted-foreground line-through opacity-60"
              : "text-foreground"
          }`}
          animate={{
            opacity: task.done ? 0.6 : 1,
          }}
          transition={{ duration: 0.3 }}
          data-testid={`text-task-${task.id}`}
        >
          {task.title}
        </motion.span>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 text-destructive hover:bg-destructive/10"
          data-testid={`button-delete-${task.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
