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
  CommissionQueryDto,
  CommissionRecordDto,
  CreatePaymentRequestDto,
  CreatePaymentResponseDto,
  CreateOrderRequestDto,
  CreateReturnRequestDto,
  CreateSellerProductRequestDto,
  FinancePeriodQueryDto,
  GenerateSettlementsRequestDto,
  ExpirePaymentsResponseDto,
  AnalyticsRevenueDto,
  InventoryValidationDto,
  LegacyApiErrorEnvelope,
  LegacyApiResponseEnvelope,
  ListCatalogQuery,
  ListNotificationsQuery,
  ListProductsQuery,
  LoginRequestDto,
  LogoutResponseDto,
  NotificationDto,
  NotificationUnreadCountDto,
  OrderDto,
  PaginatedResult,
  PaymentDto,
  ProductDto,
  ProductAutocompleteQuery,
  ProductAutocompleteSuggestionDto,
  ProductSearchQuery,
  SearchReindexResponseDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
  RefundDto,
  RefundPaymentRequestDto,
  ReturnDto,
  SellerDto,
  SellerInventoryDto,
  SellerOrderDetailDto,
  SellerOrderQueryDto,
  SellerOrderSummaryDto,
  SellerPayoutSummaryDto,
  SellerRevenueDto,
  SellerSettlementDto,
  SettlementQueryDto,
  SettlementStatus,
  ShipmentDto,
  ShipmentTrackingDto,
  UpdateSellerInventoryRequestDto,
  UpdateSellerProductRequestDto,
  UpdateShipmentStatusRequestDto,
  UpdateShipmentTrackingRequestDto,
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
      tracking: (orderId: string, options?: RequestOptions) =>
        request<ShipmentTrackingDto[]>(`/api/v1/orders/${encodeURIComponent(orderId)}/tracking`, { ...options, method: 'GET' }),
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
      shipments: {
        list: (options?: RequestOptions) => request<ShipmentDto[]>('/api/v1/seller/shipments', { ...options, method: 'GET' }),
        get: (shipmentId: string, options?: RequestOptions) =>
          request<ShipmentDto>(`/api/v1/seller/shipments/${encodeURIComponent(shipmentId)}`, { ...options, method: 'GET' }),
        updateStatus: (shipmentId: string, body: UpdateShipmentStatusRequestDto, options?: RequestOptions) =>
          request<ShipmentDto>(`/api/v1/seller/shipments/${encodeURIComponent(shipmentId)}/status`, { ...options, method: 'PATCH', body }),
        updateTracking: (shipmentId: string, body: UpdateShipmentTrackingRequestDto, options?: RequestOptions) =>
          request<ShipmentDto>(`/api/v1/seller/shipments/${encodeURIComponent(shipmentId)}/tracking`, { ...options, method: 'PATCH', body }),
      },
      analytics: {
        revenue: (options?: RequestOptions) =>
          request<AnalyticsRevenueDto>('/api/v1/seller/analytics/revenue', { ...options, method: 'GET' }),
        products: (options?: RequestOptions) => request<unknown[]>('/api/v1/seller/analytics/products', { ...options, method: 'GET' }),
      },
      orders: {
        list: (query?: SellerOrderQueryDto, options?: RequestOptions) =>
          request<PaginatedResult<SellerOrderDetailDto>>(withQuery('/api/v1/seller/orders', query), { ...options, method: 'GET' }),
        summary: (query?: SellerOrderQueryDto, options?: RequestOptions) =>
          request<SellerOrderSummaryDto>(withQuery('/api/v1/seller/orders/summary', query), { ...options, method: 'GET' }),
        get: (orderId: string, options?: RequestOptions) =>
          request<SellerOrderDetailDto>(`/api/v1/seller/orders/${encodeURIComponent(orderId)}`, { ...options, method: 'GET' }),
        markPacked: (orderId: string, options?: RequestOptions) =>
          request<ShipmentDto>(`/api/v1/seller/orders/${encodeURIComponent(orderId)}/packed`, { ...options, method: 'PATCH' }),
        markReadyToShip: (orderId: string, options?: RequestOptions) =>
          request<ShipmentDto>(`/api/v1/seller/orders/${encodeURIComponent(orderId)}/ready-to-ship`, { ...options, method: 'PATCH' }),
        updateTracking: (orderId: string, body: UpdateShipmentTrackingRequestDto, options?: RequestOptions) =>
          request<ShipmentDto>(`/api/v1/seller/orders/${encodeURIComponent(orderId)}/tracking`, { ...options, method: 'PATCH', body }),
      },
      finance: {
        revenue: (query?: FinancePeriodQueryDto, options?: RequestOptions) =>
          request<SellerRevenueDto>(withQuery('/api/v1/seller/revenue', query), { ...options, method: 'GET' }),
        commissions: (query?: CommissionQueryDto, options?: RequestOptions) =>
          request<CommissionRecordDto[]>(withQuery('/api/v1/seller/commissions', query), { ...options, method: 'GET' }),
        payoutSummary: (options?: RequestOptions) => request<SellerPayoutSummaryDto>('/api/v1/seller/payout-summary', { ...options, method: 'GET' }),
        settlements: (query?: SettlementQueryDto, options?: RequestOptions) =>
          request<SellerSettlementDto[]>(withQuery('/api/v1/seller/settlements', query), { ...options, method: 'GET' }),
        settlement: (settlementId: string, options?: RequestOptions) =>
          request<SellerSettlementDto>(`/api/v1/seller/settlements/${encodeURIComponent(settlementId)}`, { ...options, method: 'GET' }),
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
      finance: {
        commissions: (query?: CommissionQueryDto, options?: RequestOptions) =>
          request<CommissionRecordDto[]>(withQuery('/api/v1/admin/commissions', query), { ...options, method: 'GET' }),
        settlements: (query?: SettlementQueryDto, options?: RequestOptions) =>
          request<SellerSettlementDto[]>(withQuery('/api/v1/admin/settlements', query), { ...options, method: 'GET' }),
        settlement: (settlementId: string, options?: RequestOptions) =>
          request<SellerSettlementDto>(`/api/v1/admin/settlements/${encodeURIComponent(settlementId)}`, { ...options, method: 'GET' }),
        generateSettlements: (body: GenerateSettlementsRequestDto, options?: RequestOptions) =>
          request<SellerSettlementDto[]>('/api/v1/admin/settlements/generate', { ...options, method: 'POST', body }),
        updateSettlementStatus: (settlementId: string, status: SettlementStatus, options?: RequestOptions) =>
          request<SellerSettlementDto>(`/api/v1/admin/settlements/${encodeURIComponent(settlementId)}/status`, {
            ...options,
            method: 'PATCH',
            body: { status },
          }),
        overview: (query?: FinancePeriodQueryDto, options?: RequestOptions) =>
          request<SellerRevenueDto>(withQuery('/api/v1/admin/finance/overview', query), { ...options, method: 'GET' }),
        sellerEarnings: (query?: FinancePeriodQueryDto, options?: RequestOptions) =>
          request<unknown[]>(withQuery('/api/v1/admin/seller-earnings', query), { ...options, method: 'GET' }),
      },
      search: {
        reindex: (options?: RequestOptions) => request<SearchReindexResponseDto>('/api/v1/admin/search/reindex', { ...options, method: 'POST' }),
      },
      returns: {
        approve: (returnId: string, options?: RequestOptions) =>
          request<ReturnDto>(`/api/v1/admin/returns/${encodeURIComponent(returnId)}/approve`, { ...options, method: 'POST' }),
        reject: (returnId: string, reason?: string, options?: RequestOptions) =>
          request<ReturnDto>(`/api/v1/admin/returns/${encodeURIComponent(returnId)}/reject`, { ...options, method: 'POST', body: { reason } }),
        refund: (returnId: string, options?: RequestOptions) =>
          request<ReturnDto>(`/api/v1/admin/returns/${encodeURIComponent(returnId)}/refund`, { ...options, method: 'POST' }),
      },
      payments: {
        list: (options?: RequestOptions) => request<PaymentDto[]>('/api/v1/admin/payments', { ...options, method: 'GET' }),
        get: (paymentId: string, options?: RequestOptions) =>
          request<PaymentDto>(`/api/v1/admin/payments/${encodeURIComponent(paymentId)}`, { ...options, method: 'GET' }),
        refund: (paymentId: string, body: RefundPaymentRequestDto, options?: RequestOptions) =>
          request<PaymentDto>(`/api/v1/admin/payments/${encodeURIComponent(paymentId)}/refund`, {
            ...options,
            method: 'POST',
            body,
          }),
        expire: (limit?: number, options?: RequestOptions) =>
          request<ExpirePaymentsResponseDto>('/api/v1/admin/payments/expire', {
            ...options,
            method: 'POST',
            body: limit ? { limit } : undefined,
          }),
      },
      shipments: {
        list: (options?: RequestOptions) => request<ShipmentDto[]>('/api/v1/admin/shipments', { ...options, method: 'GET' }),
        get: (shipmentId: string, options?: RequestOptions) =>
          request<ShipmentDto>(`/api/v1/admin/shipments/${encodeURIComponent(shipmentId)}`, { ...options, method: 'GET' }),
        updateStatus: (shipmentId: string, body: UpdateShipmentStatusRequestDto, options?: RequestOptions) =>
          request<ShipmentDto>(`/api/v1/admin/shipments/${encodeURIComponent(shipmentId)}/status`, { ...options, method: 'PATCH', body }),
        updateTracking: (shipmentId: string, body: UpdateShipmentTrackingRequestDto, options?: RequestOptions) =>
          request<ShipmentDto>(`/api/v1/admin/shipments/${encodeURIComponent(shipmentId)}/tracking`, { ...options, method: 'PATCH', body }),
        cancel: (shipmentId: string, options?: RequestOptions) =>
          request<ShipmentDto>(`/api/v1/admin/shipments/${encodeURIComponent(shipmentId)}/cancel`, { ...options, method: 'POST' }),
      },
      refunds: {
        list: (options?: RequestOptions) => request<RefundDto[]>('/api/v1/admin/refunds', { ...options, method: 'GET' }),
      },
      notifications: {
        list: (query?: ListNotificationsQuery, options?: RequestOptions) =>
          request<NotificationDto[]>(withQuery('/api/v1/admin/notifications', query), { ...options, method: 'GET' }),
        failures: (options?: RequestOptions) =>
          request<NotificationDto[]>('/api/v1/admin/notifications/failures', { ...options, method: 'GET' }),
        retry: (notificationId: string, options?: RequestOptions) =>
          request<NotificationDto>(`/api/v1/admin/notifications/${encodeURIComponent(notificationId)}/retry`, { ...options, method: 'POST' }),
      },
    },
    shipments: {
      tracking: (shipmentId: string, options?: RequestOptions) =>
        request<ShipmentTrackingDto>(`/api/v1/shipments/${encodeURIComponent(shipmentId)}/tracking`, { ...options, method: 'GET' }),
    },
    payments: {
      create: (body: CreatePaymentRequestDto, options?: RequestOptions) =>
        request<CreatePaymentResponseDto>('/api/v1/payments/create', { ...options, method: 'POST', body }),
      verify: (body: VerifyPaymentRequestDto, options?: RequestOptions) =>
        request<PaymentDto>('/api/v1/payments/verify', { ...options, method: 'POST', body }),
      status: (paymentId: string, options?: RequestOptions) =>
        request<PaymentDto>(`/api/v1/payments/${encodeURIComponent(paymentId)}/status`, { ...options, method: 'GET' }),
      refund: (paymentId: string, body: RefundPaymentRequestDto, options?: RequestOptions) =>
        request<PaymentDto>(`/api/v1/payments/${encodeURIComponent(paymentId)}/refund`, { ...options, method: 'POST', body }),
    },
    search: {
      products: (query?: ProductSearchQuery, options?: RequestOptions) =>
        request<PaginatedResult<ProductDto>>(withQuery('/api/v1/search/products', query), { ...options, method: 'GET', auth: false }),
      autocomplete: (query: ProductAutocompleteQuery, options?: RequestOptions) =>
        request<ProductAutocompleteSuggestionDto[]>(withQuery('/api/v1/search/autocomplete', query), { ...options, method: 'GET', auth: false }),
      reindex: (options?: RequestOptions) => request<SearchReindexResponseDto>('/api/v1/admin/search/reindex', { ...options, method: 'POST' }),
    },
    returns: {
      create: (body: CreateReturnRequestDto, options?: RequestOptions) =>
        request<ReturnDto>('/api/v1/returns', { ...options, method: 'POST', body }),
      list: (options?: RequestOptions) => request<ReturnDto[]>('/api/v1/returns', { ...options, method: 'GET' }),
      get: (returnId: string, options?: RequestOptions) =>
        request<ReturnDto>(`/api/v1/returns/${encodeURIComponent(returnId)}`, { ...options, method: 'GET' }),
    },
    notifications: {
      list: (query?: ListNotificationsQuery, options?: RequestOptions) =>
        request<PaginatedResult<NotificationDto>>(withQuery('/api/v1/notifications', query), { ...options, method: 'GET' }),
      unreadCount: (options?: RequestOptions) =>
        request<NotificationUnreadCountDto>('/api/v1/notifications/unread-count', { ...options, method: 'GET' }),
      markRead: (notificationId: string, options?: RequestOptions) =>
        request<NotificationDto>(`/api/v1/notifications/${encodeURIComponent(notificationId)}/read`, { ...options, method: 'PATCH' }),
      markAllRead: (options?: RequestOptions) =>
        request<{ count: number }>('/api/v1/notifications/read-all', { ...options, method: 'PATCH' }),
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
