import type {
  ApiErrorEnvelope,
  ApiResponseEnvelope,
  AuthResponseDto,
  BrandDto,
  CartDto,
  CategoryDto,
  CheckoutDraftDto,
  CheckoutValidationDto,
  CheckoutValidationRequestDto,
  CreatePaymentRequestDto,
  CreatePaymentResponseDto,
  CreateOrderRequestDto,
  CreateReturnRequestDto,
  CreateSellerProductRequestDto,
  AnalyticsRevenueDto,
  InventoryValidationDto,
  LegacyApiErrorEnvelope,
  LegacyApiResponseEnvelope,
  ListCatalogQuery,
  ListProductsQuery,
  LoginRequestDto,
  LogoutResponseDto,
  OrderDto,
  PaginatedResult,
  PaymentDto,
  ProductDto,
  ProductSearchQuery,
  RefreshTokenRequestDto,
  RegisterRequestDto,
  ReturnDto,
  SellerDto,
  SellerInventoryDto,
  UpdateSellerInventoryRequestDto,
  UpdateSellerProductRequestDto,
  UpdateUserProfileDto,
  UserProfileDto,
  VerifyPaymentRequestDto,
  WishlistDto,
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
    auth: {
      login: (body: LoginRequestDto, options?: RequestOptions) =>
        request<AuthResponseDto>('/api/v1/auth/login', { ...options, method: 'POST', body, auth: false }),
      register: (body: RegisterRequestDto, options?: RequestOptions) =>
        request<AuthResponseDto>('/api/v1/auth/register', { ...options, method: 'POST', body, auth: false }),
      refresh: (body: RefreshTokenRequestDto, options?: RequestOptions) =>
        request<AuthResponseDto>('/api/v1/auth/refresh', { ...options, method: 'POST', body, auth: false }),
      logout: (body: RefreshTokenRequestDto, options?: RequestOptions) =>
        request<LogoutResponseDto>('/api/v1/auth/logout', { ...options, method: 'POST', body }),
      me: (options?: RequestOptions) => request<AuthResponseDto['user']>('/api/v1/auth/me', { ...options, method: 'GET' }),
    },
    account: {
      getProfile: (options?: RequestOptions) => request<UserProfileDto>('/api/v1/users/me', { ...options, method: 'GET' }),
      updateProfile: (body: UpdateUserProfileDto, options?: RequestOptions) =>
        request<UserProfileDto>('/api/v1/users/me', { ...options, method: 'PATCH', body }),
    },
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
    wishlist: {
      get: (options?: RequestOptions) => request<WishlistDto>('/api/v1/wishlist', { ...options, method: 'GET' }),
      addItem: (productId: string, options?: RequestOptions) =>
        request<WishlistDto>('/api/v1/wishlist/items', { ...options, method: 'POST', body: { productId } }),
      removeItem: (productId: string, options?: RequestOptions) =>
        request<WishlistDto>(`/api/v1/wishlist/items/${encodeURIComponent(productId)}`, {
          ...options,
          method: 'DELETE',
        }),
    },
    cart: {
      get: (options?: RequestOptions) => request<CartDto>('/api/v1/cart', { ...options, method: 'GET' }),
      addItem: (variantId: string, quantity: number, options?: RequestOptions) =>
        request<CartDto>('/api/v1/cart/items', { ...options, method: 'POST', body: { variantId, quantity } }),
      updateItem: (itemId: string, quantity: number, options?: RequestOptions) =>
        request<CartDto>(`/api/v1/cart/items/${encodeURIComponent(itemId)}`, {
          ...options,
          method: 'PATCH',
          body: { quantity },
        }),
      removeItem: (itemId: string, options?: RequestOptions) =>
        request<CartDto>(`/api/v1/cart/items/${encodeURIComponent(itemId)}`, { ...options, method: 'DELETE' }),
      clear: (options?: RequestOptions) => request<CartDto>('/api/v1/cart', { ...options, method: 'DELETE' }),
    },
    checkout: {
      get: (options?: RequestOptions) => request<CheckoutDraftDto>('/api/v1/checkout', { ...options, method: 'GET' }),
      validate: (body: CheckoutValidationRequestDto, options?: RequestOptions) =>
        request<CheckoutValidationDto>('/api/v1/checkout/validate', { ...options, method: 'POST', body }),
    },
    orders: {
      list: (options?: RequestOptions) => request<OrderDto[]>('/api/v1/orders', { ...options, method: 'GET' }),
      create: (body: CreateOrderRequestDto, options?: RequestOptions) =>
        request<OrderDto>('/api/v1/orders', { ...options, method: 'POST', body }),
      get: (orderId: string, options?: RequestOptions) =>
        request<OrderDto>(`/api/v1/orders/${encodeURIComponent(orderId)}`, { ...options, method: 'GET' }),
    },
    inventory: {
      validateCart: (cartId: string, options?: RequestOptions) =>
        request<InventoryValidationDto>(`/api/v1/inventory/cart/${encodeURIComponent(cartId)}/validate`, {
          ...options,
          method: 'GET',
        }),
    },
    seller: {
      products: {
        list: (options?: RequestOptions) => request<ProductDto[]>('/api/v1/seller/products', { ...options, method: 'GET' }),
        get: (productId: string, options?: RequestOptions) =>
          request<ProductDto>(`/api/v1/seller/products/${encodeURIComponent(productId)}`, { ...options, method: 'GET' }),
        create: (body: CreateSellerProductRequestDto, options?: RequestOptions) =>
          request<ProductDto>('/api/v1/seller/products', { ...options, method: 'POST', body }),
        update: (productId: string, body: UpdateSellerProductRequestDto, options?: RequestOptions) =>
          request<ProductDto>(`/api/v1/seller/products/${encodeURIComponent(productId)}`, { ...options, method: 'PATCH', body }),
        delete: (productId: string, options?: RequestOptions) =>
          request<ProductDto>(`/api/v1/seller/products/${encodeURIComponent(productId)}`, { ...options, method: 'DELETE' }),
      },
      inventory: {
        list: (options?: RequestOptions) => request<SellerInventoryDto[]>('/api/v1/seller/inventory', { ...options, method: 'GET' }),
        update: (variantId: string, body: UpdateSellerInventoryRequestDto, options?: RequestOptions) =>
          request<SellerInventoryDto>(`/api/v1/seller/inventory/${encodeURIComponent(variantId)}`, {
            ...options,
            method: 'PATCH',
            body,
          }),
      },
      analytics: {
        revenue: (options?: RequestOptions) =>
          request<AnalyticsRevenueDto>('/api/v1/seller/analytics/revenue', { ...options, method: 'GET' }),
        products: (options?: RequestOptions) => request<unknown[]>('/api/v1/seller/analytics/products', { ...options, method: 'GET' }),
      },
    },
    admin: {
      sellers: {
        list: (options?: RequestOptions) => request<SellerDto[]>('/api/v1/admin/sellers', { ...options, method: 'GET' }),
        approve: (sellerId: string, options?: RequestOptions) =>
          request<SellerDto>(`/api/v1/admin/sellers/${encodeURIComponent(sellerId)}/approve`, { ...options, method: 'POST' }),
        reject: (sellerId: string, options?: RequestOptions) =>
          request<SellerDto>(`/api/v1/admin/sellers/${encodeURIComponent(sellerId)}/reject`, { ...options, method: 'POST' }),
        suspend: (sellerId: string, options?: RequestOptions) =>
          request<SellerDto>(`/api/v1/admin/sellers/${encodeURIComponent(sellerId)}/suspend`, { ...options, method: 'POST' }),
      },
      products: {
        list: (options?: RequestOptions) => request<ProductDto[]>('/api/v1/admin/products', { ...options, method: 'GET' }),
        approve: (productId: string, options?: RequestOptions) =>
          request<ProductDto>(`/api/v1/admin/products/${encodeURIComponent(productId)}/approve`, { ...options, method: 'POST' }),
        reject: (productId: string, options?: RequestOptions) =>
          request<ProductDto>(`/api/v1/admin/products/${encodeURIComponent(productId)}/reject`, { ...options, method: 'POST' }),
        updateStatus: (productId: string, status: ProductDto['status'], options?: RequestOptions) =>
          request<ProductDto>(`/api/v1/admin/products/${encodeURIComponent(productId)}/status`, {
            ...options,
            method: 'PATCH',
            body: { status },
          }),
      },
      analytics: {
        revenue: (options?: RequestOptions) =>
          request<AnalyticsRevenueDto>('/api/v1/admin/analytics/revenue', { ...options, method: 'GET' }),
        categories: (options?: RequestOptions) => request<unknown[]>('/api/v1/admin/analytics/categories', { ...options, method: 'GET' }),
        products: (options?: RequestOptions) => request<unknown[]>('/api/v1/admin/analytics/products', { ...options, method: 'GET' }),
      },
      search: {
        reindex: (options?: RequestOptions) => request<{ provider: string; indexedProducts: number }>('/api/v1/admin/search/reindex', { ...options, method: 'POST' }),
      },
      returns: {
        approve: (returnId: string, options?: RequestOptions) =>
          request<ReturnDto>(`/api/v1/admin/returns/${encodeURIComponent(returnId)}/approve`, { ...options, method: 'POST' }),
        reject: (returnId: string, reason?: string, options?: RequestOptions) =>
          request<ReturnDto>(`/api/v1/admin/returns/${encodeURIComponent(returnId)}/reject`, { ...options, method: 'POST', body: { reason } }),
        refund: (returnId: string, options?: RequestOptions) =>
          request<ReturnDto>(`/api/v1/admin/returns/${encodeURIComponent(returnId)}/refund`, { ...options, method: 'POST' }),
      },
    },
    payments: {
      create: (body: CreatePaymentRequestDto, options?: RequestOptions) =>
        request<CreatePaymentResponseDto>('/api/v1/payments/create', { ...options, method: 'POST', body }),
      verify: (body: VerifyPaymentRequestDto, options?: RequestOptions) =>
        request<PaymentDto>('/api/v1/payments/verify', { ...options, method: 'POST', body }),
      refund: (paymentId: string, options?: RequestOptions) =>
        request<PaymentDto>(`/api/v1/payments/${encodeURIComponent(paymentId)}/refund`, { ...options, method: 'POST' }),
    },
    search: {
      products: (query?: ProductSearchQuery, options?: RequestOptions) =>
        request<PaginatedResult<ProductDto>>(withQuery('/api/v1/search/products', query), { ...options, method: 'GET', auth: false }),
    },
    returns: {
      create: (body: CreateReturnRequestDto, options?: RequestOptions) =>
        request<ReturnDto>('/api/v1/returns', { ...options, method: 'POST', body }),
      list: (options?: RequestOptions) => request<ReturnDto[]>('/api/v1/returns', { ...options, method: 'GET' }),
      get: (returnId: string, options?: RequestOptions) =>
        request<ReturnDto>(`/api/v1/returns/${encodeURIComponent(returnId)}`, { ...options, method: 'GET' }),
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
