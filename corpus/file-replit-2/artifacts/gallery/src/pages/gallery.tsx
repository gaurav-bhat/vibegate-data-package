import { UploadZone } from '@/components/upload-zone';
import { StatsBar } from '@/components/stats-bar';
import { ImageGrid } from '@/components/image-grid';

export default function Gallery() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">
            Gallery
          </h1>
          <p className="text-lg text-muted-foreground">
            Share and explore images with the community
          </p>
        </header>

        {/* Upload Zone */}
        <section className="mb-12">
          <UploadZone />
        </section>

        {/* Stats Bar */}
        <section className="mb-12">
          <StatsBar />
        </section>

        {/* Image Grid */}
        <section>
          <ImageGrid />
        </section>
      </div>
    </div>
  );
}
