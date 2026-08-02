import { Images } from 'lucide-react';
import type { GalleryStats } from '@workspace/api-client-react/src/generated/api.schemas';

interface GalleryStatsProps {
  stats: GalleryStats | undefined;
}

export function GalleryStatsBar({ stats }: GalleryStatsProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Images className="w-4 h-4" />
        <span className="font-mono" data-testid="text-image-count">
          {stats?.imageCount ?? 0} images
        </span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="font-mono text-muted-foreground" data-testid="text-total-size">
        {formatSize(stats?.totalSizeBytes ?? 0)}
      </div>
    </div>
  );
}
