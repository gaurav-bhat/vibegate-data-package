import { ImageIcon } from 'lucide-react';
import { UploadButton } from './upload-button';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fade-in-up">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <ImageIcon className="w-10 h-10 text-primary" />
      </div>
      
      <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">
        Your gallery is empty
      </h2>
      
      <p className="text-muted-foreground text-base sm:text-lg max-w-md mb-8">
        Start building your collection by uploading your first image. Every photo tells a story.
      </p>

      <UploadButton />
    </div>
  );
}
