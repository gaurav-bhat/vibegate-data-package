export function LoadingSkeleton() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="break-inside-avoid"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div 
            className="rounded-lg bg-muted animate-pulse"
            style={{ 
              height: `${Math.floor(Math.random() * 200) + 200}px` 
            }}
          />
        </div>
      ))}
    </div>
  );
}
