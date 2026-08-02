import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteImage, getListImagesQueryKey, getGetGalleryStatsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { Image } from '@workspace/api-client-react';

interface LightboxProps {
  images: Image[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteImage = useDeleteImage();

  const currentImage = images[currentIndex];

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteImage.mutateAsync({ id: currentImage.id });
      
      queryClient.invalidateQueries({ queryKey: getListImagesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetGalleryStatsQueryKey() });
      
      toast({
        title: 'Image deleted',
        description: `${currentImage.filename} has been removed from the gallery`,
      });

      // Close lightbox if last image, otherwise move to next
      if (images.length === 1) {
        onClose();
      } else {
        setCurrentIndex((prev) => (prev >= images.length - 1 ? 0 : prev));
      }
      
      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the image. Please try again.',
        variant: 'destructive',
      });
    }
  }, [currentImage, deleteImage, queryClient, toast, onClose, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrevious, handleNext]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
        data-testid="lightbox-overlay"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background/80 to-transparent">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate" data-testid="lightbox-filename">
              {currentImage.filename}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} of {images.length}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteImage.isPending}
              data-testid="button-delete-image"
            >
              {deleteImage.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-lightbox"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pt-24 pb-20">
          <img
            src={`/api/storage${currentImage.objectPath}`}
            alt={currentImage.filename}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            data-testid="lightbox-image"
          />
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handlePrevious}
              data-testid="button-previous-image"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleNext}
              data-testid="button-next-image"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{currentImage.filename}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
