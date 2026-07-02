import Link from 'next/link';
import type { CategoryDto } from '@nova/types';

export function CategoryStrip({ categories }: { categories: CategoryDto[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-normal text-accent">Departments</p>
          <h2 className="mt-2 text-2xl font-black">Shop by category</h2>
        </div>
        <Link href="/products" className="text-sm font-bold text-primary">
          All products
        </Link>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/categories/${category.slug}`} className="rounded-md border border-border bg-white p-4 hover:border-primary">
            <span className="text-sm font-black">{category.name}</span>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{category.description ?? 'Explore Nova marketplace picks.'}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
