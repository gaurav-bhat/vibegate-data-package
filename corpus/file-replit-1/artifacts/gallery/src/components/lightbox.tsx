import { useEffect } from 'react';
import type { GalleryImage } from '@workspace/api-client-react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
  const currentImage = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onClose, onNavigate]);

  if (!currentImage) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      data-testid="lightbox-overlay"
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
        onClick={onClose}
        data-testid="button-close-lightbox"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation buttons */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
          data-testid="button-previous-image"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {currentIndex < images.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
          data-testid="button-next-image"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Image */}
      <div
        className="max-w-7xl max-h-[90vh] px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={`/api/storage${currentImage.objectPath}`}
          alt={currentImage.filename}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          data-testid={`lightbox-image-${currentImage.id}`}
        />
        <div className="mt-4 text-center text-white">
          <p className="text-lg font-medium">{currentImage.filename}</p>
          <p className="text-sm opacity-70">
            {currentIndex + 1} of {images.length}
          </p>
        </div>
      </div>
    </div>
  );
}
