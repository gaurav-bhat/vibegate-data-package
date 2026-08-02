import type { TaskSummary as TaskSummaryType } from "@workspace/api-client-react/src/generated/api.schemas";

interface TaskSummaryProps {
  summary: TaskSummaryType;
}

export function TaskSummary({ summary }: TaskSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-card border border-card-border rounded-xl text-center" data-testid="summary-total">
        <div className="text-2xl font-semibold text-foreground">{summary.total}</div>
        <div className="text-sm text-muted-foreground mt-1">Total</div>
      </div>
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center" data-testid="summary-done">
        <div className="text-2xl font-semibold text-primary">{summary.done}</div>
        <div className="text-sm text-primary/80 mt-1">Done</div>
      </div>
      <div className="p-4 bg-accent/30 border border-accent/40 rounded-xl text-center" data-testid="summary-pending">
        <div className="text-2xl font-semibold text-accent-foreground">{summary.pending}</div>
        <div className="text-sm text-accent-foreground/70 mt-1">Pending</div>
      </div>
    </div>
  );
}
