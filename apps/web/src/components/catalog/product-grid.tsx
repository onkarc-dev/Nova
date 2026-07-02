import type { ProductDto } from '@nova/types';
import { ProductCard } from '@/components/catalog/product-card';

export function ProductGrid({ products }: { products: ProductDto[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
