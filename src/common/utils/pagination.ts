export interface PaginationInput {
  page: number;
  limit: number;
}

export interface PaginationMeta extends PaginationInput {
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function getPagination(input: PaginationInput): { skip: number; take: number } {
  const page = Math.max(1, input.page);
  const take = Math.min(100, Math.max(1, input.limit));
  return { skip: (page - 1) * take, take };
}

export function getPaginationMeta(input: PaginationInput, total: number): PaginationMeta {
  const limit = Math.min(100, Math.max(1, input.limit));
  const page = Math.max(1, input.page);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 };
}
