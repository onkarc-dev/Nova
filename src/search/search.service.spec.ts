import type { PrismaService } from '@database/prisma.service';
import { SearchService } from './search.service';

interface ProductFindManyArgs {
  where?: {
    category?: unknown;
  };
}

describe('SearchService', () => {
  function createService() {
    const findMany = jest.fn<Promise<{ id: string; name: string }[]>, [ProductFindManyArgs]>();
    findMany.mockResolvedValue([{ id: 'product_1', name: 'Kurta' }]);
    const prisma = {
      product: {
        findMany,
        count: jest.fn<Promise<number>, [unknown]>().mockResolvedValue(1),
      },
    };
    return { prisma, service: new SearchService(prisma as unknown as PrismaService) };
  }

  it('returns paginated product search results from the database fallback', async () => {
    const { prisma, service } = createService();

    const result = await service.searchProducts({ q: 'kurta', category: 'women', page: 1, limit: 10 });

    expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    expect(result.items).toEqual([{ id: 'product_1', name: 'Kurta' }]);
    expect(prisma.product.findMany.mock.calls[0]?.[0].where?.category).toEqual({ slug: 'women' });
  });
});
