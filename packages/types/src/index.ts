export interface ApiMeta {
  requestId?: string;
  timestamp?: string;
  path?: string;
  version?: string;
  pagination?: PaginationMeta;
}

export interface ApiResponseEnvelope<T> {
  success: true;
  data: T;
  metadata: ApiMeta;
}

export interface LegacyApiResponseEnvelope<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code?: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  metadata?: ApiMeta;
}

export interface LegacyApiErrorEnvelope {
  status: 'error';
  message: string;
  code?: string;
  details?: ApiErrorDetail[];
  meta?: ApiMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface BrandDto {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface StoreDto {
  id: string;
  sellerId?: string;
  name: string;
  slug: string;
  logo?: string | null;
  banner?: string | null;
  description?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  isVerified: boolean;
}

export interface SellerDto {
  id: string;
  userId: string;
  businessName: string;
  legalName: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  stores?: StoreDto[];
}

export interface UserDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
  status?: UserStatus;
  roles?: string[];
}

export type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface AuthenticatedUserDto {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roles: string[];
}

export interface UserProfileDto {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto extends AuthTokensDto {
  user: AuthenticatedUserDto;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface LogoutResponseDto {
  revoked: true;
}

export interface UpdateUserProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export type AddressType = 'BILLING' | 'SHIPPING' | 'BOTH';

export interface AddressDto {
  id: string;
  userId: string;
  type: AddressType;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WishlistDto {
  id: string;
  userId?: string;
  name: string;
  items: WishlistItemDto[];
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WishlistItemDto {
  productId: string;
  createdAt: string;
  product: ProductDto;
}

export interface CartItemDto {
  id: string;
  variant: ProductVariantDto;
  product?: ProductDto;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartDto {
  id: string;
  userId?: string | null;
  items: CartItemDto[];
  status?: 'ACTIVE' | 'CHECKED_OUT' | 'ABANDONED';
  summary: CartSummaryDto;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartSummaryDto {
  itemCount: number;
  subtotalCents: number;
  currency: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'EXPIRED';

export type PaymentProvider = 'NULL' | 'MANUAL_PENDING' | 'MANUAL_DEV' | 'STRIPE' | 'RAZORPAY' | 'COD';

export type RefundStatus = 'REQUESTED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'CANCELLED';

export interface PaymentDto {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  providerRef?: string | null;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  refundedCents?: number;
  expiresAt?: string | null;
  authorizedAt?: string | null;
  capturedAt?: string | null;
  failedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  refunds?: RefundDto[];
}

export interface RefundDto {
  id: string;
  orderId: string;
  paymentId?: string | null;
  returnId?: string | null;
  amountCents: number;
  reason?: string | null;
  status: RefundStatus;
  providerRef?: string | null;
  processedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItemDto {
  id: string;
  orderId: string;
  sellerId: string;
  storeId: string;
  productId: string;
  variantId: string;
  skuSnapshot: string;
  nameSnapshot: string;
  storeNameSnapshot: string;
  sellerNameSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  product?: ProductDto;
  variant?: ProductVariantDto;
  store?: Pick<StoreDto, 'id' | 'name' | 'slug'>;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  userId?: string;
  cartId?: string | null;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  placedAt?: string;
  updatedAt?: string;
  shippingAddress?: AddressDto | null;
  billingAddress?: AddressDto | null;
  items: OrderItemDto[];
  payments?: PaymentDto[];
}


export type ShipmentProvider = 'MANUAL' | 'SHIPROCKET' | 'DELHIVERY' | 'PORTER' | 'LOCAL_COURIER';

export type ShipmentStatus =
  | 'PENDING'
  | 'PACKED'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'CANCELLED'
  | 'RETURN_PICKUP_REQUESTED'
  | 'RETURN_PICKED_UP'
  | 'RETURN_IN_TRANSIT'
  | 'RETURN_DELIVERED';

export interface ShipmentEventDto {
  id?: string;
  shipmentId?: string;
  status: ShipmentStatus;
  message: string;
  location?: string | null;
  occurredAt: string;
  createdAt?: string;
}

export interface ShipmentDto {
  id: string;
  orderId: string;
  sellerId: string;
  storeId: string;
  provider: ShipmentProvider;
  status: ShipmentStatus;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDeliveryAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  events?: ShipmentEventDto[];
}

export interface ShipmentTrackingDto extends Pick<ShipmentDto, 'id' | 'orderId' | 'status' | 'courierName' | 'trackingNumber' | 'trackingUrl' | 'estimatedDeliveryAt' | 'deliveredAt'> {
  events: ShipmentEventDto[];
}

export interface UpdateShipmentStatusRequestDto {
  status: ShipmentStatus;
  message?: string;
  location?: string;
  occurredAt?: string;
}

export interface UpdateShipmentTrackingRequestDto {
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryAt?: string;
}

export type CommissionStatus = 'PENDING' | 'LOCKED' | 'SETTLED' | 'REVERSED';
export type SettlementStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface SellerOrderQueryDto {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shipmentStatus?: ShipmentStatus;
  from?: string;
  to?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'revenue_desc' | 'revenue_asc';
}

export interface SellerOrderDetailDto extends OrderDto {
  sellerSummary?: { grossAmountCents: number; commissionAmountCents: number; itemCount: number };
  shipments?: ShipmentDto[];
  returns?: ReturnDto[];
  timeline?: Array<{ type: string; entityId: string; at: string; label: string }>;
}

export interface SellerOrderSummaryDto {
  grossSalesCents: number;
  commissionCents: number;
  netSalesCents: number;
  orderItemCount: number;
  orderCount: number;
}

export interface CommissionRecordDto {
  id: string;
  sellerId: string;
  storeId: string;
  orderId: string;
  orderItemId: string;
  paymentId: string;
  settlementId?: string | null;
  grossAmountCents: number;
  commissionRateBps: number;
  commissionAmountCents: number;
  netAmountCents: number;
  currency: string;
  status: CommissionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerSettlementDto {
  id: string;
  sellerId: string;
  storeId: string;
  settlementNumber: string;
  grossAmountCents: number;
  commissionAmountCents: number;
  refundAdjustmentCents: number;
  netPayoutCents: number;
  currency: string;
  status: SettlementStatus;
  periodStart: string;
  periodEnd: string;
  paidAt?: string | null;
  failedAt?: string | null;
  commissions?: CommissionRecordDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerRevenueDto {
  grossSalesCents: number;
  commissionCents: number;
  refundsCents: number;
  netEarningsCents: number;
  pendingPayoutCents: number;
  paidPayoutCents: number;
  orderCount: number;
  topProducts: Array<{ productId?: string; name?: string; grossSalesCents: number; commissionRecordCount: number }>;
}

export interface SellerPayoutSummaryDto {
  pendingPayoutCents: number;
  processingPayoutCents: number;
  paidPayoutCents: number;
  failedPayoutCents: number;
  counts: Record<'pending' | 'processing' | 'paid' | 'failed', number>;
}

export interface FinancePeriodQueryDto {
  from?: string;
  to?: string;
}

export interface CommissionQueryDto extends FinancePeriodQueryDto {
  status?: CommissionStatus;
  sellerId?: string;
  storeId?: string;
}

export interface SettlementQueryDto extends FinancePeriodQueryDto {
  status?: SettlementStatus;
  sellerId?: string;
  storeId?: string;
}

export interface GenerateSettlementsRequestDto {
  periodStart: string;
  periodEnd: string;
  sellerId?: string;
  storeId?: string;
}

export interface CheckoutDraftDto {
  cart: CartDto;
  addresses: AddressDto[];
  summary: CartSummaryDto;
  pricing: CheckoutPricingDto;
  paymentIntegrationStatus: 'PENDING';
}

export interface CheckoutValidationRequestDto {
  shippingAddressId: string;
  billingAddressId?: string;
}

export interface CheckoutValidationDto extends CheckoutDraftDto {
  selectedShippingAddressId: string;
  selectedBillingAddressId: string;
  readyForPayment: false;
  paymentIntegrationStatus: 'PENDING';
}

export interface CheckoutPricingDto {
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
}

export interface CreateOrderRequestDto {
  cartId: string;
  shippingAddressId: string;
  billingAddressId?: string;
}

export interface InventoryValidationDto {
  cartId: string;
  valid: boolean;
  items: Array<{
    variantId: string;
    requestedQuantity: number;
    availableQuantity: number;
  }>;
}

export interface PaymentMethodPlaceholderDto {
  id?: string;
  provider?: string;
  status: 'NOT_CONFIGURED' | 'PENDING_PROVIDER';
}

export interface ReturnRequestPlaceholderDto {
  orderId: string;
  reason?: string;
  status: 'DRAFT';
}

export interface ProductImageDto {
  id: string;
  url: string;
  alt?: string | null;
  altText?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ProductVariantDto {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  compareAtCents?: number | null;
  attributes?: Record<string, string | number | boolean>;
  currency?: string;
  isActive?: boolean;
  product?: ProductDto;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  category?: CategoryDto | null;
  brand?: BrandDto | null;
  store?: StoreDto | null;
  images?: ProductImageDto[];
  variants?: ProductVariantDto[];
  ratingAverage?: number | null;
  reviewCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerProductVariantInput {
  /** Stable variant id for safe seller updates; omit when creating a new variant. */
  id?: string;
  sku: string;
  name: string;
  priceCents: number;
  compareAtCents?: number;
  currency?: string;
  attributes?: Record<string, string | number | boolean>;
  isActive?: boolean;
}

export interface SellerProductImageInput {
  url: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface CreateSellerProductRequestDto {
  storeId: string;
  categoryId: string;
  brandId?: string;
  name: string;
  slug?: string;
  description: string;
  status?: ProductDto['status'];
  variants: SellerProductVariantInput[];
  images?: SellerProductImageInput[];
}

export type UpdateSellerProductRequestDto = Partial<Omit<CreateSellerProductRequestDto, 'storeId'>>;

export interface SellerInventoryDto {
  id: string;
  storeId: string;
  variantId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  safetyStock: number;
  updatedAt?: string;
  variant?: ProductVariantDto;
  store?: Pick<StoreDto, 'id' | 'name' | 'slug'>;
}

export interface UpdateSellerInventoryRequestDto {
  onHand?: number;
  reserved?: number;
  safetyStock?: number;
}

export interface CreatePaymentRequestDto {
  orderId: string;
}

export interface CreatePaymentResponseDto {
  payment: PaymentDto;
  razorpayKeyId?: string | null;
}

export interface VerifyPaymentRequestDto {
  paymentId: string;
  providerOrderId: string;
  providerPaymentId: string;
  providerRef?: string;
  signature: string;
}

export interface RefundPaymentRequestDto {
  amountCents: number;
  reason?: string;
  idempotencyKey?: string;
}

export interface ExpirePaymentsResponseDto {
  expiredCount: number;
  paymentIds: string[];
}

export interface ProductSearchQuery extends ListProductsQuery {
  q?: string;
  category?: string;
  brand?: string;
  seller?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'relevance';
}

export interface ProductAutocompleteQuery {
  q: string;
  limit?: number;
}

export interface ProductAutocompleteSuggestionDto {
  value: string;
  type: 'product' | 'category' | 'brand' | 'store';
  score: number;
}

export interface SearchReindexResponseDto {
  provider: string;
  indexedProducts: number;
}

// ---------------------------------------------------------------------------
// Phase 7 — Analytics & Business Intelligence
// ---------------------------------------------------------------------------

export type AnalyticsGranularity = 'day' | 'week' | 'month';
export type AnalyticsExportType = 'revenue' | 'orders' | 'products' | 'settlements';

export interface AnalyticsPeriodQuery {
  from?: string;
  to?: string;
}

export interface AnalyticsTimeSeriesQuery extends AnalyticsPeriodQuery {
  granularity?: AnalyticsGranularity;
  sellerId?: string;
  storeId?: string;
  categoryId?: string;
  productId?: string;
}

export interface SellerAnalyticsTimeSeriesQuery extends AnalyticsPeriodQuery {
  granularity?: AnalyticsGranularity;
  storeId?: string;
  categoryId?: string;
  productId?: string;
}

export interface AnalyticsListQuery extends AnalyticsPeriodQuery {
  limit?: number;
}

export interface AnalyticsExportQuery extends AnalyticsPeriodQuery {
  type: AnalyticsExportType;
}

export interface RevenueTimeBucketDto {
  bucketStart: string;
  bucketEnd: string;
  grossSalesCents: number;
  netSalesCents: number;
  commissionCents: number;
  refundCents: number;
  orderCount: number;
  itemQuantity: number;
}

export interface RevenueSummaryDto {
  grossSalesCents: number;
  netSalesCents: number;
  commissionCents: number;
  refundCents: number;
  orderCount: number;
  itemQuantity: number;
}

export interface AnalyticsRevenueDto {
  from: string;
  to: string;
  granularity: AnalyticsGranularity;
  buckets: RevenueTimeBucketDto[];
  summary: RevenueSummaryDto;
}

export interface AnalyticsTopEntryDto {
  id: string;
  label: string;
  revenueCents: number;
  quantity: number;
}

export interface AdminOverviewDto {
  period: { from: string; to: string };
  gmvCents: number;
  netRevenueCents: number;
  commissionRevenueCents: number;
  refundAmountCents: number;
  totalOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  paymentSuccessRatePercent: number;
  averageOrderValueCents: number;
  activeSellers: number;
  activeProducts: number;
  lowStockProducts: number;
  topSellers: Array<{ sellerId: string; businessName: string; grossSalesCents: number; commissionCents: number; netEarningsCents: number; orderItemCount: number }>;
  topProducts: AnalyticsTopEntryDto[];
  topCategories: AnalyticsTopEntryDto[];
  shipmentStatusBreakdown: Record<string, number>;
  returnRatePercent: number;
  refundRatePercent: number;
}

export interface SellerOverviewDto {
  period: { from: string; to: string };
  grossSalesCents: number;
  netSalesCents: number;
  commissionCents: number;
  refundAmountCents: number;
  totalOrders: number;
  byStatus: Record<string, number>;
  averageOrderValueCents: number;
  activeProductCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  topProducts: AnalyticsTopEntryDto[];
  shipmentStatusBreakdown: Record<string, number>;
  returnRatePercent: number;
  refundRatePercent: number;
}

export interface AnalyticsOrdersDto {
  from: string;
  to: string;
  totalOrders: number;
  byStatus: Record<string, number>;
  buckets?: Array<{ bucketStart: string; bucketEnd: string; orderCount: number; itemQuantity: number }> | null;
}

export interface AnalyticsPaymentsDto {
  from: string;
  to: string;
  created: number;
  captured: number;
  failed: number;
  successRatePercent: number;
  refundCount: number;
  refundAmountCents: number;
  byProvider: Array<{ provider: string; count: number; amountCents: number }>;
  failedPaymentTrend: Array<{ bucketStart: string; bucketEnd: string; failedCount: number }>;
}

export interface AnalyticsShipmentsDto {
  from: string;
  to: string;
  byStatus: Record<string, number>;
  averageDeliveryHours: number | null;
  delayedCount: number;
}

export interface AnalyticsReturnsDto {
  from: string;
  to: string;
  returnCount: number;
  refundCount: number;
  refundAmountCents: number;
  returnRatePercent: number;
  refundRatePercent: number;
  topReturnReasons: Array<{ reason: string; count: number }>;
}

export interface AnalyticsProductsDto {
  from: string;
  to: string;
  topByRevenue: AnalyticsTopEntryDto[];
  topByQuantity: AnalyticsTopEntryDto[];
  lowStockProducts: Array<{ productId: string; name: string; sellable: number; safetyStock: number }>;
  lowStockCount: number;
  outOfStockCount: number;
  conversionRatePercent?: number | null;
}

export interface AnalyticsSellersDto {
  from: string;
  to: string;
  topSellers: Array<{ sellerId: string; businessName: string; grossSalesCents: number; commissionCents: number; netEarningsCents: number; orderItemCount: number }>;
}

export interface AnalyticsCategoriesDto {
  from: string;
  to: string;
  topCategories: AnalyticsTopEntryDto[];
  topBrands: AnalyticsTopEntryDto[];
}

export interface AnalyticsInventoryDto {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  reservedTotal: number;
  sellableTotal: number;
  inventoryValueCentsEstimate: number;
  lowStockProducts: Array<{ productId: string; name: string; sellable: number; safetyStock: number }>;
}

export interface AnalyticsExportResultDto {
  csv: string;
  filename: string;
}

export interface ReturnDto {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  order?: OrderDto;
}

export type NotificationChannel = 'EMAIL' | 'IN_APP' | 'SMS' | 'WHATSAPP';

export type NotificationType =
  | 'ORDER_PLACED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'REFUND_REQUESTED'
  | 'REFUND_PROCESSED'
  | 'SHIPMENT_CREATED'
  | 'SHIPMENT_SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'SELLER_NEW_ORDER'
  | 'SELLER_PRODUCT_APPROVED'
  | 'SELLER_PRODUCT_REJECTED'
  | 'ADMIN_PAYMENT_FAILED'
  | 'ADMIN_REFUND_ALERT';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED' | 'READ';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface NotificationAttemptDto {
  id: string;
  notificationId: string;
  provider: string;
  status: NotificationStatus;
  errorMessage?: string | null;
  attemptedAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  idempotencyKey: string;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  sentAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  attempts?: NotificationAttemptDto[];
}

export interface NotificationUnreadCountDto {
  count: number;
}

export interface ListNotificationsQuery {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
}

export interface CreateReturnRequestDto {
  orderId: string;
  type: 'RETURN' | 'EXCHANGE';
  reason: string;
}

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  brandSlug?: string;
  storeSlug?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'relevance';
}

export interface ListCatalogQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
