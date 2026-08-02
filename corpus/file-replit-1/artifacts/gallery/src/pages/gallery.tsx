import { useListImages, useDeleteImage, getListImagesQueryKey } from '@workspace/api-client-react';
import { GalleryGrid } from '@/components/gallery-grid';
import { EmptyState } from '@/components/empty-state';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { UploadButton } from '@/components/upload-button';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon } from 'lucide-react';

export default function Gallery() {
  const { data: images, isLoading } = useListImages({
    query: {
      queryKey: getListImagesQueryKey(),
      refetchInterval: 3000,
    },
  });

  const deleteImage = useDeleteImage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await deleteImage.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListImagesQueryKey() });
      toast({
        title: 'Image deleted',
        description: 'The image has been removed from your gallery.',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl text-foreground">Gallery</h1>
                {images && images.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {images.length} {images.length === 1 ? 'image' : 'images'}
                  </p>
                )}
              </div>
            </div>

            {images && images.length > 0 && <UploadButton />}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {isLoading ? (
          <LoadingSkeleton />
        ) : !images || images.length === 0 ? (
          <EmptyState />
        ) : (
          <GalleryGrid images={images} onDelete={handleDelete} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            Built with care for your memories
          </p>
        </div>
      </footer>
    </div>
  );
}
