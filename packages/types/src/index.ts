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
  roles?: string[];
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
