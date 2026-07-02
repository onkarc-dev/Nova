import { AlertCircle, PackageSearch } from 'lucide-react';

export function CatalogError({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-8 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-accent" />
      <h2 className="mt-3 text-xl font-black">Catalog is temporarily unavailable</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{message}</p>
    </div>
  );
}

export function CatalogEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-white p-8 text-center">
      <PackageSearch className="mx-auto h-8 w-8 text-primary" />
      <h2 className="mt-3 text-xl font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-md border border-border bg-white">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
