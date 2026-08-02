import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddTaskInputProps {
  onAdd: (title: string) => void;
  disabled?: boolean;
}

export function AddTaskInput({ onAdd, disabled }: AddTaskInputProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2" data-testid="form-add-task">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new task..."
        disabled={disabled}
        className="flex-1 h-12 px-4 text-[15px] bg-card border-card-border focus-visible:ring-primary"
        data-testid="input-task-title"
      />
      <Button
        type="submit"
        disabled={!title.trim() || disabled}
        className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
        data-testid="button-add-task"
      >
        <Plus className="h-5 w-5 mr-1" />
        Add
      </Button>
    </form>
  );
}
