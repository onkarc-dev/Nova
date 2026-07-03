import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';

export type WishlistDto = Prisma.WishlistGetPayload<{ include: ReturnType<WishlistService['wishlistInclude']> }>;

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(user: AuthUser): Promise<WishlistDto> {
    return this.getOrCreateWishlist(user.id);
  }

  async addItem(user: AuthUser, productId: string): Promise<WishlistDto> {
    const wishlist = await this.getOrCreateWishlist(user.id);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: ProductStatus.ACTIVE, store: { isVerified: true } },
      select: { id: true },
    });

    if (!product) throw new NotFoundException('Product not found.');

    try {
      await this.prisma.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId: product.id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Product is already in wishlist.');
      }
      throw error;
    }

    return this.getOrCreateWishlist(user.id);
  }

  async removeItem(user: AuthUser, productId: string): Promise<WishlistDto> {
    const wishlist = await this.getOrCreateWishlist(user.id);
    await this.prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
    return this.getOrCreateWishlist(user.id);
  }

  private async getOrCreateWishlist(userId: string): Promise<WishlistDto> {
    const existing = await this.prisma.wishlist.findFirst({
      where: { userId, name: 'Default' },
      include: this.wishlistInclude(),
    });

    if (existing) return existing;

    return this.prisma.wishlist.create({
      data: { userId, name: 'Default' },
      include: this.wishlistInclude(),
    });
  }

  private wishlistInclude() {
    return {
      items: {
        orderBy: { createdAt: 'desc' as const },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
              brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
              store: { select: { id: true, name: true, slug: true } },
              images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }], take: 5 },
              variants: {
                where: { isActive: true },
                orderBy: { createdAt: 'asc' as const },
                select: { id: true, sku: true, name: true, priceCents: true, compareAtCents: true, currency: true, isActive: true },
              },
            },
          },
        },
      },
    } satisfies Prisma.WishlistInclude;
  }
}
