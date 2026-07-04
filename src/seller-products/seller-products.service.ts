import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, SellerStatus } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { PrismaService } from '@database/prisma.service';
import type { CreateSellerProductDto, UpdateSellerProductDto } from './dto/seller-product.dto';

@Injectable()
export class SellerProductsService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(user: AuthUser) {
    return this.prisma.product.findMany({
      where: { store: { seller: { userId: user.id } } },
      orderBy: { updatedAt: 'desc' },
      include: this.includeProduct(),
    });
  }

  async getMine(user: AuthUser, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, store: { seller: { userId: user.id } } },
      include: this.includeProduct(),
    });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  async create(user: AuthUser, dto: CreateSellerProductDto) {
    if (!dto.variants.length) throw new BadRequestException('At least one product variant is required.');
    const sellerStore = await this.prisma.store.findFirst({
      where: { id: dto.storeId, seller: { userId: user.id, status: SellerStatus.APPROVED } },
      include: { seller: true },
    });
    if (!sellerStore) throw new ForbiddenException('Only approved sellers can create products for their own stores.');
    if (!sellerStore.isVerified) throw new ForbiddenException('Store must be verified before products can be published.');

    try {
      const product = await this.prisma.product.create({
        data: {
          storeId: sellerStore.id,
          categoryId: dto.categoryId,
          brandId: dto.brandId ?? null,
          name: dto.name,
          slug: dto.slug ?? this.slugify(dto.name),
          description: dto.description,
          status: dto.status === ProductStatus.ARCHIVED ? ProductStatus.DRAFT : (dto.status ?? ProductStatus.DRAFT),
          variants: { create: dto.variants.map((variant) => this.toVariantCreate(variant)) },
          images: { create: (dto.images ?? []).map((image) => this.toImageCreate(image, dto.name)) },
        },
        include: this.includeProduct(),
      });
      return product;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) throw new ConflictException('Product slug or SKU already exists.');
      throw error;
    }
  }

  async update(user: AuthUser, productId: string, dto: UpdateSellerProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, store: { seller: { userId: user.id } } },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found.');

    try {
      return await this.prisma.runInTransaction(async (tx) => {
        await tx.product.update({ where: { id: product.id }, data: this.toProductUpdate(dto) });
        if (dto.variants) {
          await tx.variant.deleteMany({ where: { productId: product.id } });
          await tx.variant.createMany({ data: dto.variants.map((variant) => ({ productId: product.id, ...this.toVariantCreate(variant) })) });
        }
        if (dto.images) {
          await tx.productImage.deleteMany({ where: { productId: product.id } });
          await tx.productImage.createMany({
            data: dto.images.map((image) => ({ productId: product.id, ...this.toImageCreate(image, dto.name ?? 'Product image') })),
          });
        }
        const updated = await tx.product.findUnique({ where: { id: product.id }, include: this.includeProduct() });
        if (!updated) throw new NotFoundException('Product not found.');
        return updated;
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) throw new ConflictException('Product slug or SKU already exists.');
      throw error;
    }
  }

  async delete(user: AuthUser, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, store: { seller: { userId: user.id } } },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('Product not found.');
    return this.prisma.product.update({ where: { id: product.id }, data: { status: ProductStatus.ARCHIVED }, include: this.includeProduct() });
  }

  private toProductUpdate(dto: UpdateSellerProductDto): Prisma.ProductUpdateInput {
    const data: Prisma.ProductUpdateInput = {};
    if (dto.categoryId !== undefined) data.category = { connect: { id: dto.categoryId } };
    if (dto.brandId !== undefined) data.brand = dto.brandId ? { connect: { id: dto.brandId } } : { disconnect: true };
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    return data;
  }

  private toVariantCreate(variant: CreateSellerProductDto['variants'][number]): Prisma.VariantCreateWithoutProductInput {
    return {
      sku: variant.sku,
      name: variant.name,
      attributes: variant.attributes ?? {},
      priceCents: variant.priceCents,
      compareAtCents: variant.compareAtCents ?? null,
      currency: variant.currency ?? 'INR',
      isActive: variant.isActive ?? true,
    };
  }

  private toImageCreate(image: NonNullable<CreateSellerProductDto['images']>[number], fallbackAltText: string): Prisma.ProductImageCreateWithoutProductInput {
    return {
      url: image.url,
      altText: image.altText ?? fallbackAltText,
      sortOrder: image.sortOrder ?? 0,
      isPrimary: image.isPrimary ?? false,
    };
  }

  private includeProduct() {
    return {
      category: true,
      brand: true,
      store: { include: { seller: { select: { id: true, businessName: true, status: true } } } },
      variants: { orderBy: { createdAt: 'asc' as const } },
      images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }] },
    } satisfies Prisma.ProductInclude;
  }

  private slugify(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
