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

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export type PaymentProvider = 'NULL' | 'MANUAL_PENDING' | 'STRIPE' | 'RAZORPAY' | 'COD';

export interface PaymentDto {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  providerRef?: string | null;
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
  providerRef?: string;
  signature?: string;
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

export interface AnalyticsRevenueDto {
  revenueCents: number;
  orderCount: number;
  paidPaymentCount: number;
  returnCount: number;
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
