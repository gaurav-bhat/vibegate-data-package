import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRequestUploadUrl, useCreateImage, getListImagesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}

export function UploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const requestUploadUrl = useRequestUploadUrl();
  const createImage = useCreateImage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Filter for images only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast({
        title: 'Invalid files',
        description: 'Please select image files only.',
        variant: 'destructive',
      });
      return;
    }

    // Initialize progress tracking
    const initialProgress: UploadProgress[] = imageFiles.map(file => ({
      filename: file.name,
      progress: 0,
      status: 'uploading',
    }));
    setUploads(initialProgress);

    // Upload each file
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        // Step 1: Request presigned URL
        const urlResponse = await requestUploadUrl.mutateAsync({
          data: {
            name: file.name,
            size: file.size,
            contentType: file.type,
          },
        });

        // Step 2: Upload to GCS
        const xhr = new XMLHttpRequest();
        
        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploads(prev => prev.map((up, idx) => 
                idx === i ? { ...up, progress } : up
              ));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Upload failed')));
          
          xhr.open('PUT', urlResponse.uploadURL);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        // Step 3: Register in database
        await createImage.mutateAsync({
          data: {
            objectPath: urlResponse.objectPath,
            filename: file.name,
            contentType: file.type,
            sizeBytes: file.size,
          },
        });

        setUploads(prev => prev.map((up, idx) => 
          idx === i ? { ...up, status: 'complete', progress: 100 } : up
        ));
      } catch (error) {
        console.error('Upload error:', error);
        setUploads(prev => prev.map((up, idx) => 
          idx === i ? { ...up, status: 'error' } : up
        ));
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    // Refresh gallery
    queryClient.invalidateQueries({ queryKey: getListImagesQueryKey() });

    // Clear uploads after a delay
    setTimeout(() => {
      setUploads([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 2000);
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />
      
      <Button
        size="lg"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploads.length > 0}
        className="shadow-lg"
        data-testid="button-upload"
      >
        <Upload className="mr-2 h-5 w-5" />
        Upload Images
      </Button>

      {/* Upload progress overlay */}
      {uploads.length > 0 && (
        <div className="fixed bottom-6 right-6 w-80 bg-card border border-border rounded-lg shadow-2xl p-4 z-40 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Uploading {uploads.length} {uploads.length === 1 ? 'image' : 'images'}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setUploads([])}
              data-testid="button-close-upload-progress"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {uploads.map((upload, idx) => (
              <div key={idx} className="space-y-1" data-testid={`upload-progress-${idx}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1 mr-2">{upload.filename}</span>
                  <span className={
                    upload.status === 'complete' ? 'text-primary' :
                    upload.status === 'error' ? 'text-destructive' :
                    'text-muted-foreground'
                  }>
                    {upload.status === 'complete' ? '✓' :
                     upload.status === 'error' ? '✗' :
                     `${upload.progress}%`}
                  </span>
                </div>
                <Progress 
                  value={upload.progress} 
                  className="h-1.5"
                  data-testid={`progress-bar-${idx}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
