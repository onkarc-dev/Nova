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
  name?: string | null;
  items?: ProductDto[];
}

export interface CartItemDto {
  id: string;
  product: ProductDto;
  variant: ProductVariantDto;
  quantity: number;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  status?: 'ACTIVE' | 'CHECKED_OUT' | 'ABANDONED';
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  createdAt?: string;
}

export interface CheckoutDraftDto {
  cartId: string;
  shippingAddressId?: string;
  paymentIntegrationStatus: 'PENDING';
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

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  brandSlug?: string;
  storeSlug?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
}

export interface ListCatalogQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
