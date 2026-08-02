import { StatsBar } from '@/components/stats-bar';
import { ProductTable } from '@/components/product-table';

export default function ProductsPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary-foreground"
              >
                <path d="M3 3h18v18H3zM9 9h6v6H9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Product Admin
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your product catalog
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <StatsBar />
        <ProductTable />
      </div>
    </div>
  );
}
