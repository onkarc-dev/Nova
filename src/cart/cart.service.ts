import { Injectable, NotFoundException } from '@nestjs/common';
import { CartStatus, Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import type { AddCartItemDto } from './dto/add-cart-item.dto';
import type { UpdateCartItemDto } from './dto/update-cart-item.dto';

export type CartDto = Prisma.CartGetPayload<{ include: ReturnType<CartService['cartInclude']> }> & {
  summary: CartSummaryDto;
};

export interface CartSummaryDto {
  itemCount: number;
  subtotalCents: number;
  currency: string;
}

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(user: AuthUser): Promise<CartDto> {
    return this.attachSummary(await this.getOrCreateCart(user.id));
  }

  async addItem(user: AuthUser, dto: AddCartItemDto): Promise<CartDto> {
    const cart = await this.getOrCreateCart(user.id);
    const variant = await this.getPurchasableVariant(dto.variantId);

    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
      create: { cartId: cart.id, variantId: variant.id, quantity: dto.quantity },
      update: { quantity: { increment: dto.quantity } },
    });

    return this.getCart(user);
  }

  async updateItem(user: AuthUser, itemId: string, dto: UpdateCartItemDto): Promise<CartDto> {
    const cart = await this.getOrCreateCart(user.id);
    const item = await this.getOwnedCartItem(cart.id, itemId);
    await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity: dto.quantity } });
    return this.getCart(user);
  }

  async removeItem(user: AuthUser, itemId: string): Promise<CartDto> {
    const cart = await this.getOrCreateCart(user.id);
    const item = await this.getOwnedCartItem(cart.id, itemId);
    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.getCart(user);
  }

  async clearCart(user: AuthUser): Promise<CartDto> {
    const cart = await this.getOrCreateCart(user.id);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(user);
  }

  private async getOrCreateCart(userId: string) {
    const existing = await this.prisma.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE },
      include: this.cartInclude(),
    });

    if (existing) return existing;

    return this.prisma.cart.create({
      data: { userId, status: CartStatus.ACTIVE },
      include: this.cartInclude(),
    });
  }

  private async getPurchasableVariant(variantId: string) {
    const variant = await this.prisma.variant.findFirst({
      where: {
        id: variantId,
        isActive: true,
        product: { status: ProductStatus.ACTIVE, store: { isVerified: true } },
      },
      select: { id: true },
    });

    if (!variant) throw new NotFoundException('Product variant not found.');
    return variant;
  }

  private async getOwnedCartItem(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId }, select: { id: true } });
    if (!item) throw new NotFoundException('Cart item not found.');
    return item;
  }

  private attachSummary<T extends Prisma.CartGetPayload<{ include: ReturnType<CartService['cartInclude']> }>>(cart: T): T & { summary: CartSummaryDto } {
    const subtotalCents = cart.items.reduce((total, item) => total + item.quantity * item.variant.priceCents, 0);
    const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    return {
      ...cart,
      summary: {
        itemCount,
        subtotalCents,
        currency: cart.items[0]?.variant.currency ?? 'INR',
      },
    };
  }

  private cartInclude() {
    return {
      items: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  category: { select: { id: true, name: true, slug: true } },
                  brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
                  store: { select: { id: true, name: true, slug: true } },
                  images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }], take: 5 },
                },
              },
            },
          },
        },
      },
    } satisfies Prisma.CartInclude;
  }
}
