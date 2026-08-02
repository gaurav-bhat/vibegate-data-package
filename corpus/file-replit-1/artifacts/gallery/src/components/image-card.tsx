import { useState } from 'react';
import type { GalleryImage } from '@workspace/api-client-react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageCardProps {
  image: GalleryImage;
  index: number;
  onClick: () => void;
  onDelete: (id: number) => void;
  'data-testid'?: string;
}

export function ImageCard({ image, index, onClick, onDelete, 'data-testid': testId }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="group relative break-inside-avoid animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      data-testid={testId}
    >
      <div className="relative overflow-hidden rounded-lg bg-muted shadow-md hover:shadow-xl transition-all duration-300">
        {!imageLoaded && (
          <div className="aspect-square w-full bg-muted animate-pulse" />
        )}
        <img
          src={`/api/storage${image.objectPath}`}
          alt={image.filename}
          className={`w-full h-auto object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } ${isHovered ? 'scale-105' : 'scale-100'}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          data-testid={`image-img-${image.id}`}
        />

        {/* Overlay on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <p className="text-sm font-medium truncate">{image.filename}</p>
            <p className="text-xs opacity-80">{formatFileSize(image.sizeBytes)}</p>
          </div>

          <Button
            variant="destructive"
            size="icon"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image.id);
            }}
            data-testid={`button-delete-${image.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
