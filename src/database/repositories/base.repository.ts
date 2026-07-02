import { getPagination, type PaginationInput } from '@common/utils/pagination';
import type { PrismaService } from '@database/prisma.service';

type Delegate = {
  findMany(args?: unknown): Promise<unknown[]>;
  count(args?: unknown): Promise<number>;
  findUnique(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
};

export abstract class BaseRepository<TEntity> {
  protected constructor(
    protected readonly prisma: PrismaService,
    private readonly delegate: Delegate,
  ) {}

  async findPaginated(args: { pagination: PaginationInput; where?: unknown; orderBy?: unknown; include?: unknown; select?: unknown }): Promise<{
    items: TEntity[];
    total: number;
  }> {
    const { pagination, ...queryArgs } = args;
    const paginationArgs = getPagination(pagination);
    const [items, total] = await this.prisma.transaction(async () => {
      const resultItems = await this.delegate.findMany({ ...queryArgs, ...paginationArgs });
      const resultTotal = await this.delegate.count({ where: 'where' in queryArgs ? queryArgs.where : undefined });
      return [resultItems, resultTotal] as const;
    });
    return { items: items as TEntity[], total };
  }

  async softDelete(where: unknown): Promise<TEntity> {
    return (await this.delegate.update({ where, data: { deletedAt: new Date() } })) as TEntity;
  }
}
