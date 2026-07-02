import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CatalogToolbar({ search, categorySlug }: { search?: string; categorySlug?: string }) {
  return (
    <form action="/products" className="flex flex-col gap-3 rounded-md border border-border bg-white p-4 sm:flex-row">
      <div className="flex min-w-0 flex-1 items-center rounded-md border border-border px-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          name="search"
          defaultValue={search}
          className="h-11 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm outline-none"
          placeholder="Search products, brands, and stores"
        />
      </div>
      {categorySlug ? <input type="hidden" name="categorySlug" value={categorySlug} /> : null}
      <select name="sort" className="h-11 rounded-md border border-border bg-white px-3 text-sm font-semibold outline-none">
        <option value="newest">Newest</option>
        <option value="name_asc">Name A-Z</option>
      </select>
      <Button type="submit">Search</Button>
    </form>
  );
}
