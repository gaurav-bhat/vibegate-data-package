import { useState } from 'react';
import type { GalleryImage } from '@workspace/api-client-react';
import { ImageCard } from './image-card';
import { Lightbox } from './lightbox';

interface GalleryGridProps {
  images: GalleryImage[];
  onDelete: (id: number) => void;
}

export function GalleryGrid({ images, onDelete }: GalleryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {images.map((image, index) => (
          <ImageCard
            key={image.id}
            image={image}
            index={index}
            onClick={() => setLightboxIndex(index)}
            onDelete={onDelete}
            data-testid={`image-card-${image.id}`}
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
