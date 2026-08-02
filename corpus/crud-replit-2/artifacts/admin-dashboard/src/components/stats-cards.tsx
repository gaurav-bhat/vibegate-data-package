import { Package, DollarSign, TrendingUp } from 'lucide-react';
import type { ProductStats } from '@workspace/api-client-react';

interface StatsCardsProps {
  stats: ProductStats | undefined;
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-5 bg-card">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Products',
      value: stats?.totalCount || 0,
      icon: Package,
      format: (v: number) => v.toLocaleString(),
      testId: 'stat-total-count',
    },
    {
      label: 'Total Inventory Value',
      value: stats?.totalValue || 0,
      icon: DollarSign,
      format: (v: number) => `$${v.toFixed(2)}`,
      testId: 'stat-total-value',
    },
    {
      label: 'Average Price',
      value: stats?.avgPrice || 0,
      icon: TrendingUp,
      format: (v: number) => `$${v.toFixed(2)}`,
      testId: 'stat-avg-price',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="border border-border rounded-lg p-5 bg-card"
            data-testid={card.testId}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.label}
              </p>
            </div>
            <p className="text-2xl font-semibold table-mono mt-2">
              {card.format(card.value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
