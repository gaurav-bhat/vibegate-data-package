import { useState } from 'react';
import { useListImages } from '@workspace/api-client-react';
import { ImageIcon } from 'lucide-react';
import { Lightbox } from './lightbox';
import type { Image } from '@workspace/api-client-react';

export function ImageGrid() {
  const { data: images, isLoading } = useListImages();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="masonry-grid" data-testid="image-grid-loading">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="masonry-item">
            <div 
              className="w-full rounded-lg overflow-hidden bg-muted animate-shimmer"
              style={{ height: `${200 + Math.random() * 200}px` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center" data-testid="empty-state">
        <div className="rounded-full p-6 bg-muted mb-6">
          <ImageIcon className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No images yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Start building your gallery by uploading your first images
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="masonry-grid" data-testid="image-grid">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="masonry-item animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <button
              onClick={() => setSelectedImageIndex(index)}
              className="group relative w-full rounded-lg overflow-hidden bg-muted hover-elevate transition-transform hover:scale-[1.02] active:scale-[0.98]"
              data-testid={`image-card-${image.id}`}
            >
              <img
                src={`/api/storage${image.objectPath}`}
                alt={image.filename}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-sm font-medium truncate">
                    {image.filename}
                  </p>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {selectedImageIndex !== null && images && (
        <Lightbox
          images={images}
          initialIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </>
  );
}
