import { useGetProductStats } from '@workspace/api-client-react';
import { Package, DollarSign, TrendingUp } from 'lucide-react';

export function StatsBar() {
  const { data: stats, isLoading } = useGetProductStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-card-border rounded-lg p-6">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Products',
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      testId: 'stat-total-products',
    },
    {
      label: 'Total Inventory Value',
      value: `$${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      testId: 'stat-total-value',
    },
    {
      label: 'Average Price',
      value: `$${stats.averagePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      testId: 'stat-average-price',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-card border border-card-border rounded-lg p-6 transition-all duration-200 hover:border-primary/50"
            data-testid={stat.testId}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <div className="text-3xl font-mono font-semibold stat-glow">
              {stat.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
