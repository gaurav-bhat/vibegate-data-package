import { useGetGalleryStats } from '@workspace/api-client-react';
import { Image, HardDrive, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function StatsBar() {
  const { data: stats, isLoading } = useGetGalleryStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="stats-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-card-border rounded-lg p-5">
            <div className="h-5 w-24 animate-shimmer rounded mb-2" />
            <div className="h-7 w-16 animate-shimmer rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in" data-testid="stats-bar">
      <div className="bg-card border border-card-border rounded-lg p-5 hover-elevate" data-testid="stat-total-images">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-md bg-primary/10">
            <Image className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Images</p>
            <p className="text-2xl font-bold">{stats.totalImages.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-5 hover-elevate" data-testid="stat-total-storage">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-md bg-accent/10">
            <HardDrive className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Storage Used</p>
            <p className="text-2xl font-bold">{formatBytes(stats.totalSize)}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-5 hover-elevate" data-testid="stat-latest-upload">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-md bg-muted">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Latest Upload</p>
            <p className="text-2xl font-bold">
              {stats.latestUploadAt
                ? formatDistanceToNow(new Date(stats.latestUploadAt), { addSuffix: true })
                : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
