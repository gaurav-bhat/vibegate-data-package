import { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  useRequestUploadUrl,
  useCreateImage,
  getListImagesQueryKey,
  getGetGalleryStatsQueryKey,
} from '@workspace/api-client-react';

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestUploadUrl = useRequestUploadUrl();
  const createImage = useCreateImage();

  const uploadFile = useCallback(
    async (file: File) => {
      const uploadId = Math.random().toString(36).substring(7);

      setUploadingFiles((prev) => [
        ...prev,
        { id: uploadId, file, progress: 0, status: 'uploading' },
      ]);

      try {
        // Step 1: Request presigned URL
        const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
          data: {
            name: file.name,
            size: file.size,
            contentType: file.type || 'application/octet-stream',
          },
        });

        // Step 2: Upload directly to GCS
        const xhr = new XMLHttpRequest();
        
        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadId ? { ...f, progress: percent } : f
                )
              );
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.open('PUT', uploadURL);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.send(file);
        });

        // Step 3: Register image in gallery
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadId ? { ...f, status: 'processing' } : f
          )
        );

        await createImage.mutateAsync({
          data: {
            objectPath,
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
          },
        });

        // Success
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadId ? { ...f, status: 'complete', progress: 100 } : f
          )
        );

        // Invalidate queries to refresh gallery
        queryClient.invalidateQueries({ queryKey: getListImagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGalleryStatsQueryKey() });

        // Remove from upload list after delay
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
        }, 2000);
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadId
              ? {
                  ...f,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        );
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
      }
    },
    [requestUploadUrl, createImage, queryClient, toast]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith('image/')
      );

      if (imageFiles.length === 0) {
        toast({
          title: 'No images selected',
          description: 'Please select image files only',
          variant: 'destructive',
        });
        return;
      }

      imageFiles.forEach((file) => uploadFile(file));
    },
    [uploadFile, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg transition-all duration-200
          ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50'}
        `}
        data-testid="upload-zone"
      >
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className={`rounded-full p-4 mb-4 transition-colors ${isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
            <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          
          <h3 className="text-lg font-semibold mb-2">
            {isDragging ? 'Drop your images here' : 'Upload images'}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Drag and drop your photos, or click to browse
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            data-testid="file-input"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            className="font-medium"
            data-testid="button-choose-files"
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Choose files
          </Button>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="mt-6 space-y-3" data-testid="uploading-files-list">
          {uploadingFiles.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-card border border-card-border"
              data-testid={`upload-item-${upload.id}`}
            >
              <div className="flex-shrink-0">
                {upload.status === 'uploading' || upload.status === 'processing' ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : upload.status === 'complete' ? (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                    <svg className="w-3 h-3 text-destructive-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.file.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono w-10 text-right">
                    {upload.progress}%
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {upload.status === 'uploading' && 'Uploading...'}
                {upload.status === 'processing' && 'Processing...'}
                {upload.status === 'complete' && 'Complete'}
                {upload.status === 'error' && 'Failed'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
