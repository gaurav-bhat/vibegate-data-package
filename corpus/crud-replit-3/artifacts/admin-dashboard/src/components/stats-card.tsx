import { Card } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: string;
  testId?: string;
}

export function StatsCard({ title, value, trend, testId }: StatsCardProps) {
  return (
    <Card className="p-5 border-card-border" data-testid={testId}>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold tracking-tight font-mono" data-testid={`${testId}-value`}>
          {value}
        </p>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </div>
    </Card>
  );
}
