import type {
  ApiErrorEnvelope,
  ApiResponseEnvelope,
  BrandDto,
  CategoryDto,
  LegacyApiErrorEnvelope,
  LegacyApiResponseEnvelope,
  ListCatalogQuery,
  ListProductsQuery,
  PaginatedResult,
  ProductDto,
} from '@nova/types';

export interface ApiClientOptions {
  baseUrl?: string;
  getAccessToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void | Promise<void>;
  fetcher?: typeof fetch;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

export class NovaApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: ApiErrorEnvelope['error']['details'] | LegacyApiErrorEnvelope['details'] | undefined;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: ApiErrorEnvelope['error']['details'] | LegacyApiErrorEnvelope['details'],
  ) {
    super(message);
    this.name = 'NovaApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const DEFAULT_API_URL = 'http://localhost:4000';

export function getDefaultApiUrl(): string {
  const env = getRuntimeEnv();
  return env.NEXT_PUBLIC_API_URL ?? env.API_URL ?? DEFAULT_API_URL;
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = trimTrailingSlash(options.baseUrl ?? getDefaultApiUrl());
  const fetcher = options.fetcher ?? fetch;

  async function request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
    const { auth, body: requestBody, ...fetchOptions } = requestOptions;
    const headers = new Headers(requestOptions.headers);

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    let body: BodyInit | undefined;
    if (requestBody !== undefined) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(requestBody);
    }

    if (auth !== false) {
      const token = await options.getAccessToken?.();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const init: RequestInit = {
      ...fetchOptions,
      headers,
    };

    if (body !== undefined) {
      init.body = body;
    }

    let response: Response;
    try {
      response = await fetcher(`${baseUrl}${normalizePath(path)}`, init);
    } catch {
      throw new NovaApiError('Unable to reach the Nova API. Check that the backend is running.', 0, 'API_UNAVAILABLE');
    }

    const payload = await parseJson(response);

    if (!response.ok) {
      const error = normalizeApiError(payload, response.status);
      if (response.status === 401) {
        await options.onUnauthorized?.();
      }
      throw error;
    }

    return unwrapResponse<T>(payload);
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: 'POST', body }),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: 'PATCH', body }),
    delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
    request,
    catalog: {
      listProducts: (query?: ListProductsQuery, options?: RequestOptions) =>
        request<PaginatedResult<ProductDto>>(withQuery('/api/v1/catalog/products', query), {
          ...options,
          method: 'GET',
          auth: false,
        }),
      searchProducts: (query?: ListProductsQuery, options?: RequestOptions) =>
        request<PaginatedResult<ProductDto>>(withQuery('/api/v1/catalog/products/search', query), {
          ...options,
          method: 'GET',
          auth: false,
        }),
      getProductBySlug: (slug: string, options?: RequestOptions) =>
        request<ProductDto>(`/api/v1/catalog/products/${encodeURIComponent(slug)}`, {
          ...options,
          method: 'GET',
          auth: false,
        }),
      listCategories: (query?: ListCatalogQuery, options?: RequestOptions) =>
        request<PaginatedResult<CategoryDto>>(withQuery('/api/v1/catalog/categories', query), {
          ...options,
          method: 'GET',
          auth: false,
        }),
      listBrands: (query?: ListCatalogQuery, options?: RequestOptions) =>
        request<PaginatedResult<BrandDto>>(withQuery('/api/v1/catalog/brands', query), {
          ...options,
          method: 'GET',
          auth: false,
        }),
    },
  };
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new NovaApiError('The API returned an invalid JSON response.', response.status);
  }
}

function unwrapResponse<T>(payload: unknown): T {
  if (isApiResponseEnvelope<T>(payload)) {
    return payload.data;
  }
  if (isLegacyApiResponseEnvelope<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}

function normalizeApiError(payload: unknown, status: number): NovaApiError {
  if (isApiErrorEnvelope(payload)) {
    return new NovaApiError(payload.error.message, status, payload.error.code, payload.error.details);
  }

  if (isLegacyApiErrorEnvelope(payload)) {
    return new NovaApiError(payload.message, status, payload.code, payload.details);
  }

  return new NovaApiError('The API request failed.', status);
}

function isApiResponseEnvelope<T>(payload: unknown): payload is ApiResponseEnvelope<T> {
  return Boolean(payload && typeof payload === 'object' && 'success' in payload && 'data' in payload);
}

function isLegacyApiResponseEnvelope<T>(payload: unknown): payload is LegacyApiResponseEnvelope<T> {
  return Boolean(payload && typeof payload === 'object' && 'status' in payload && 'data' in payload);
}

function isApiErrorEnvelope(payload: unknown): payload is ApiErrorEnvelope {
  return Boolean(payload && typeof payload === 'object' && 'success' in payload && 'error' in payload);
}

function isLegacyApiErrorEnvelope(payload: unknown): payload is LegacyApiErrorEnvelope {
  return Boolean(payload && typeof payload === 'object' && 'status' in payload && 'message' in payload);
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function withQuery<T extends object>(path: string, query?: T): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (isQueryValue(value)) {
      params.set(key, String(value));
    }
  }

  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
}

function isQueryValue(value: unknown): value is string | number | boolean {
  return value !== undefined && value !== null && value !== '';
}

function getRuntimeEnv(): Partial<Record<'NEXT_PUBLIC_API_URL' | 'API_URL', string>> {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: Partial<Record<'NEXT_PUBLIC_API_URL' | 'API_URL', string>>;
    };
  };

  return runtime.process?.env ?? {};
}
