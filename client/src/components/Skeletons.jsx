export function ProductCardSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden" aria-hidden>
      <div className="aspect-[3/4] bg-brand-100/70" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-4/5 rounded-full bg-brand-100" />
        <div className="h-5 w-2/5 rounded-full bg-brand-100" />
        <div className="h-4 w-1/3 rounded-full bg-brand-50" />
        <div className="h-9 rounded-full bg-brand-100" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export const Block = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-brand-100/70 ${className}`} aria-hidden />
);
