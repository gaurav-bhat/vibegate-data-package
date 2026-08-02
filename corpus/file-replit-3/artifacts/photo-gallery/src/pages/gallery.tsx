import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListImages,
  getListImagesQueryKey,
  useGetGalleryStats,
  getGetGalleryStatsQueryKey,
  useRequestUploadUrl,
  useCreateImage,
  useDeleteImage,
} from '@workspace/api-client-react';
import type { GalleryImage } from '@workspace/api-client-react/src/generated/api.schemas';
import { UploadZone } from '@/components/upload-zone';
import { ImageLightbox } from '@/components/image-lightbox';
import { GalleryStatsBar } from '@/components/gallery-stats';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: images, isLoading: imagesLoading } = useListImages();
  const { data: stats } = useGetGalleryStats();
  const requestUploadUrl = useRequestUploadUrl();
  const createImage = useCreateImage();
  const deleteImage = useDeleteImage();

  const requestUploadUrlRef = useRef(requestUploadUrl.mutate);
  requestUploadUrlRef.current = requestUploadUrl.mutate;

  const createImageRef = useRef(createImage.mutate);
  createImageRef.current = createImage.mutate;

  const handleUpload = useCallback(
    async (files: File[]) => {
      setIsUploading(true);

      try {
        for (const file of files) {
          // Step 1: Request presigned URL
          const uploadData = await new Promise<{
            uploadURL: string;
            objectPath: string;
          }>((resolve, reject) => {
            requestUploadUrlRef.current(
              {
                data: {
                  name: file.name,
                  size: file.size,
                  contentType: file.type,
                },
              },
              {
                onSuccess: (data) => resolve(data),
                onError: (error) => reject(error),
              }
            );
          });

          // Step 2: Upload file to GCS
          const uploadResponse = await fetch(uploadData.uploadURL, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type,
            },
            body: file,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }

          // Step 3: Save metadata
          await new Promise<void>((resolve, reject) => {
            createImageRef.current(
              {
                data: {
                  objectPath: uploadData.objectPath,
                  filename: file.name,
                  contentType: file.type,
                  sizeBytes: file.size,
                },
              },
              {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
              }
            );
          });
        }

        // Step 4: Invalidate queries
        queryClient.invalidateQueries({ queryKey: getListImagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGalleryStatsQueryKey() });

        toast({
          title: 'Upload complete',
          description: `${files.length} image${files.length > 1 ? 's' : ''} uploaded successfully`,
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Failed to upload images',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [queryClient, toast]
  );

  const handleDelete = useCallback(
    (id: number) => {
      deleteImage.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListImagesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetGalleryStatsQueryKey() });
            setSelectedImage(null);
            toast({
              title: 'Image deleted',
              description: 'The image has been removed from the gallery',
            });
          },
          onError: (error) => {
            toast({
              title: 'Delete failed',
              description: error instanceof Error ? error.message : 'Failed to delete image',
              variant: 'destructive',
            });
          },
        }
      );
    },
    [deleteImage, queryClient, toast]
  );

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-title">
            Gallery
          </h1>
          <div className="flex items-center gap-6">
            <GalleryStatsBar stats={stats} />
            <UploadZone onUpload={handleUpload} isUploading={isUploading} />
          </div>
        </div>
      </header>

      {/* Gallery */}
      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {imagesLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" data-testid="loader-images" />
          </div>
        ) : !images || images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2" data-testid="text-empty-title">
              No images yet
            </h2>
            <p className="text-muted-foreground max-w-sm" data-testid="text-empty-description">
              Upload your first image or drag and drop anywhere on the page to get started
            </p>
          </div>
        ) : (
          <div className="masonry-grid">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="masonry-item group cursor-pointer animate-slide-up"
                style={{ animationDelay: `${Math.min(index * 0.05, 0.6)}s` }}
                onClick={() => setSelectedImage(image)}
                data-testid={`card-image-${image.id}`}
              >
                <div className="relative overflow-hidden rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg">
                  <img
                    src={`/api/storage${image.objectPath}`}
                    alt={image.filename}
                    className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    data-testid={`img-thumbnail-${image.id}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-sm font-medium truncate">
                        {image.filename}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {selectedImage && (
        <ImageLightbox
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
