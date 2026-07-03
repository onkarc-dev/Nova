import { ConflictException, Injectable } from '@nestjs/common';
import { CartStatus, Prisma, ProductStatus } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { PrismaService } from '@database/prisma.service';

interface ReservationItem {
  variantId: string;
  storeId: string;
  quantity: number;
}

@Injectable()
export class InventoryReservationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateBuyerCart(user: AuthUser, cartId: string) {
    return this.prisma.runInTransaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: { id: cartId, userId: user.id, status: CartStatus.ACTIVE },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!cart) throw new ConflictException('Active cart is unavailable for inventory validation.');

      const items = [];
      for (const item of cart.items) {
        if (!item.variant.isActive || item.variant.product.status !== ProductStatus.ACTIVE) {
          throw new ConflictException('A cart item is no longer available.');
        }
        const availableQuantity = await this.getAvailableQuantity(tx, item.variantId, item.variant.product.storeId);
        if (availableQuantity < item.quantity) {
          throw new ConflictException('Insufficient inventory for one or more cart items.');
        }
        items.push({
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          availableQuantity,
        });
      }

      return { cartId: cart.id, valid: true, items };
    });
  }

  async reserveOrderItems(tx: Prisma.TransactionClient, items: ReservationItem[]): Promise<void> {
    for (const item of items) {
      await this.reserveVariant(tx, item);
    }
  }

  async validateAvailability(tx: Prisma.TransactionClient, items: ReservationItem[]): Promise<void> {
    for (const item of items) {
      const available = await this.getAvailableQuantity(tx, item.variantId, item.storeId);
      if (available < item.quantity) {
        throw new ConflictException('Insufficient inventory for one or more cart items.');
      }
    }
  }

  private async reserveVariant(tx: Prisma.TransactionClient, item: ReservationItem): Promise<void> {
    let remaining = item.quantity;
    const inventories = await tx.inventory.findMany({
      where: { variantId: item.variantId, storeId: item.storeId },
      orderBy: { updatedAt: 'asc' },
    });

    for (const inventory of inventories) {
      if (remaining <= 0) break;
      const available = inventory.onHand - inventory.reserved - inventory.safetyStock;
      if (available <= 0) continue;

      const reservationQuantity = Math.min(available, remaining);
      const updated = await tx.inventory.updateMany({
        where: {
          id: inventory.id,
          reserved: { lte: inventory.onHand - inventory.safetyStock - reservationQuantity },
        },
        data: { reserved: { increment: reservationQuantity } },
      });

      if (updated.count === 0) {
        throw new ConflictException('Inventory changed while creating the order. Please review your cart and try again.');
      }

      remaining -= reservationQuantity;
    }

    if (remaining > 0) {
      throw new ConflictException('Insufficient inventory for one or more cart items.');
    }
  }

  private async getAvailableQuantity(tx: Prisma.TransactionClient, variantId: string, storeId: string): Promise<number> {
    const inventories = await tx.inventory.findMany({
      where: { variantId, storeId },
      select: { onHand: true, reserved: true, safetyStock: true },
    });

    return inventories.reduce((total, inventory) => total + Math.max(0, inventory.onHand - inventory.reserved - inventory.safetyStock), 0);
  }
}
