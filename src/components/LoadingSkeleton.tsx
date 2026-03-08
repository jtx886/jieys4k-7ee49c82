export default function LoadingSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-xl bg-secondary" />
          <div className="mt-2 h-4 bg-secondary rounded w-3/4" />
          <div className="mt-1 h-3 bg-secondary rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
