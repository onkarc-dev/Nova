import { getPagination, getPaginationMeta } from './pagination';

describe('pagination helpers', () => {
  it('converts page and limit to Prisma skip/take values', () => {
    expect(getPagination({ page: 3, limit: 25 })).toEqual({ skip: 50, take: 25 });
  });

  it('clamps invalid pagination values to safe defaults', () => {
    expect(getPagination({ page: 0, limit: 500 })).toEqual({ skip: 0, take: 100 });
    expect(getPagination({ page: -4, limit: -10 })).toEqual({ skip: 0, take: 1 });
  });

  it('builds pagination metadata', () => {
    expect(getPaginationMeta({ page: 2, limit: 20 }, 45)).toEqual({
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('keeps totalPages at one for empty result sets', () => {
    expect(getPaginationMeta({ page: 1, limit: 20 }, 0)).toMatchObject({
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});
