import { Logger } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import { DatabaseSearchProvider } from './database-search.provider';
import { getMeilisearchConfig, MeilisearchProvider } from './meilisearch.provider';
import { createSearchProvider } from './search.module';
import type { SearchProvider } from './search-provider.interface';
import { SearchService } from './search.service';

type ProductFindManyArgs = {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
};

type ProductCountArgs = {
  where?: Record<string, unknown>;
};

type ProductFindUniqueArgs = {
  where: { id: string };
  include?: Record<string, unknown>;
};

function product(overrides: Partial<ReturnType<typeof baseProduct>> = {}) {
  return { ...baseProduct(), ...overrides };
}

function baseProduct() {
  return {
    id: 'product_1',
    storeId: 'store_1',
    categoryId: 'category_1',
    brandId: 'brand_1',
    name: 'Cotton Kurta',
    slug: 'cotton-kurta',
    description: 'Soft cotton kurta',
    status: ProductStatus.ACTIVE,
    seoTitle: null,
    seoDescription: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    category: { id: 'category_1', name: 'Women', slug: 'women' },
    brand: { id: 'brand_1', name: 'Nova Basics', slug: 'nova-basics' },
    store: { id: 'store_1', sellerId: 'seller_1', name: 'Cadde Store', slug: 'cadde-store', isVerified: true },
    variants: [{ priceCents: 5000, currency: 'INR', isActive: true }],
    images: [{ url: 'https://example.com/kurta.jpg' }],
    ratings: [{ value: 4 }],
  };
}

function createPrismaMock(products = [product()]) {
  const findMany = jest.fn<Promise<ReturnType<typeof product>[]>, [ProductFindManyArgs]>().mockResolvedValue(products);
  const count = jest.fn<Promise<number>, [ProductCountArgs]>().mockResolvedValue(products.length);
  const findUnique = jest.fn<Promise<ReturnType<typeof product> | null>, [ProductFindUniqueArgs]>().mockResolvedValue(products[0] ?? null);
  return {
    product: {
      findMany,
      count,
      findUnique,
    },
  };
}

describe('DatabaseSearchProvider', () => {
  it('filters active verified products by q/category/brand/seller and price range', async () => {
    const prisma = createPrismaMock();
    const provider = new DatabaseSearchProvider(prisma as unknown as PrismaService);

    const result = await provider.searchProducts({
      q: 'kurta',
      category: 'women',
      brand: 'nova-basics',
      seller: 'cadde-store',
      minPriceCents: 1000,
      maxPriceCents: 6000,
      page: 1,
      limit: 10,
    });

    expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: ProductStatus.ACTIVE,
          category: { slug: 'women', isActive: true },
          brand: { slug: 'nova-basics', isActive: true },
          store: { isVerified: true, OR: [{ sellerId: 'cadde-store' }, { slug: 'cadde-store' }] },
          variants: { some: { isActive: true, priceCents: { gte: 1000, lte: 6000 } } },
        }),
      }),
    );
  });

  it('sorts price_asc and price_desc by real minimum active variant price', async () => {
    const low = product({ id: 'low', name: 'Low', variants: [{ priceCents: 1000, currency: 'INR', isActive: true }] });
    const high = product({ id: 'high', name: 'High', variants: [{ priceCents: 9000, currency: 'INR', isActive: true }] });
    const prisma = createPrismaMock([high, low]);
    const provider = new DatabaseSearchProvider(prisma as unknown as PrismaService);

    await expect(provider.searchProducts({ sort: 'price_asc' })).resolves.toMatchObject({ items: [{ id: 'low' }, { id: 'high' }] });
    await expect(provider.searchProducts({ sort: 'price_desc' })).resolves.toMatchObject({ items: [{ id: 'high' }, { id: 'low' }] });
  });

  it('paginates sorted fallback results', async () => {
    const first = product({ id: 'first', createdAt: new Date('2026-01-03T00:00:00.000Z') });
    const second = product({ id: 'second', createdAt: new Date('2026-01-02T00:00:00.000Z') });
    const third = product({ id: 'third', createdAt: new Date('2026-01-01T00:00:00.000Z') });
    const prisma = createPrismaMock([third, first, second]);
    const provider = new DatabaseSearchProvider(prisma as unknown as PrismaService);

    const result = await provider.searchProducts({ page: 2, limit: 1 });

    expect(result.items).toMatchObject([{ id: 'second' }]);
    expect(result.pagination).toEqual({ page: 2, limit: 1, total: 3, totalPages: 3 });
  });

  it('autocomplete ranks prefix matches and removes duplicates by normalized value', async () => {
    const prisma = createPrismaMock([
      product({ name: 'Kurta', category: { id: 'category_1', name: 'Kurtas', slug: 'kurtas' } }),
      product({ id: 'product_2', name: 'kurta ', category: { id: 'category_2', name: 'Sale Kurtas', slug: 'sale-kurtas' } }),
    ]);
    const provider = new DatabaseSearchProvider(prisma as unknown as PrismaService);

    const suggestions = await provider.autocompleteProducts('kur', 5);

    expect(suggestions[0]).toMatchObject({ value: 'Kurta', type: 'product', score: 100 });
    expect(suggestions.filter((suggestion) => suggestion.value.toLowerCase().trim() === 'kurta')).toHaveLength(1);
  });

  it('admin reindex returns the active verified product count', async () => {
    const prisma = createPrismaMock();
    const provider = new DatabaseSearchProvider(prisma as unknown as PrismaService);

    await expect(provider.reindexProducts()).resolves.toBe(1);
    expect(prisma.product.count).toHaveBeenCalledWith({ where: { status: ProductStatus.ACTIVE, store: { isVerified: true } } });
  });
});

describe('Search provider selection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses the database fallback when Meilisearch env vars are missing', () => {
    delete process.env.MEILISEARCH_HOST;
    delete process.env.MEILISEARCH_API_KEY;
    const prisma = createPrismaMock() as unknown as PrismaService;
    const databaseProvider = new DatabaseSearchProvider(prisma);

    expect(getMeilisearchConfig()).toBeNull();
    expect(createSearchProvider(databaseProvider, prisma)).toBe(databaseProvider);
  });

  it('selects Meilisearch when host and API key exist', () => {
    process.env.MEILISEARCH_HOST = 'http://localhost:7700';
    process.env.MEILISEARCH_API_KEY = 'test-key';
    process.env.MEILISEARCH_INDEX_PRODUCTS = 'cadde_products';
    const prisma = createPrismaMock() as unknown as PrismaService;
    const databaseProvider = new DatabaseSearchProvider(prisma);

    expect(getMeilisearchConfig()).toEqual({ host: 'http://localhost:7700', apiKey: 'test-key', indexName: 'cadde_products' });
    expect(createSearchProvider(databaseProvider, prisma)).toBeInstanceOf(MeilisearchProvider);
  });
});

describe('SearchService indexing orchestration', () => {
  it('delegates product indexing without blocking callers', async () => {
    const provider = {
      name: 'database',
      searchProducts: jest.fn(),
      autocompleteProducts: jest.fn(),
      indexProduct: jest.fn<Promise<void>, [string]>().mockRejectedValue(new Error('search down')),
      removeProduct: jest.fn(),
      reindexProducts: jest.fn(),
    } satisfies SearchProvider;
    const loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {
      return undefined;
    });
    const service = new SearchService(provider);

    expect(() => {
      service.scheduleProductIndex('product_1');
    }).not.toThrow();
    await Promise.resolve();

    expect(provider.indexProduct).toHaveBeenCalledWith('product_1');
    expect(loggerSpy).toHaveBeenCalledWith('Search indexing failed for product product_1.', expect.any(String));
    loggerSpy.mockRestore();
  });
});
