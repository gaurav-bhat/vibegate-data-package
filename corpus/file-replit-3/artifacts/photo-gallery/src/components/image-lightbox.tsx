import { useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GalleryImage } from '@workspace/api-client-react/src/generated/api.schemas';

interface ImageLightboxProps {
  image: GalleryImage;
  onClose: () => void;
  onDelete: (id: number) => void;
}

export function ImageLightbox({ image, onClose, onDelete }: ImageLightboxProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      data-testid="lightbox-overlay"
    >
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex flex-col gap-1">
          <p className="text-white font-medium text-lg" data-testid="text-filename">
            {image.filename}
          </p>
          <p className="text-white/60 font-mono text-sm" data-testid="text-filesize">
            {formatFileSize(image.sizeBytes)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this image?')) {
                onDelete(image.id);
              }
            }}
            className="text-white hover:bg-white/10 hover:text-destructive"
            data-testid="button-delete"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
            data-testid="button-close"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <img
        src={`/api/storage${image.objectPath}`}
        alt={image.filename}
        className="max-w-[90vw] max-h-[85vh] object-contain animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        data-testid="img-lightbox"
      />
    </div>
  );
}
