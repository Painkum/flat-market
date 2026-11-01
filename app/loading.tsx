export default function Loading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="border border-line">
          <div className="aspect-square animate-pulse bg-line/60" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-24 animate-pulse bg-line/60" />
            <div className="h-7 w-40 animate-pulse bg-line/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
