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

  async releaseOrderItems(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
    const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, storeId: true, quantity: true } });
    for (const item of items) {
      await this.releaseVariant(tx, item);
    }
  }

  async deductOrderItems(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
    const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, storeId: true, quantity: true } });
    for (const item of items) {
      await this.deductVariant(tx, item);
    }
  }

  async listSellerInventory(user: AuthUser) {
    return this.prisma.inventory.findMany({
      where: { store: { seller: { userId: user.id } } },
      orderBy: { updatedAt: 'desc' },
      include: {
        store: { select: { id: true, name: true, slug: true } },
        warehouse: true,
        variant: { include: { product: { select: { id: true, name: true, slug: true, status: true } } } },
      },
    });
  }

  async updateSellerInventory(
    user: AuthUser,
    variantId: string,
    dto: { onHand?: number; reserved?: number; safetyStock?: number },
  ) {
    return this.prisma.runInTransaction(async (tx) => {
      const inventory = await tx.inventory.findFirst({
        where: { variantId, store: { seller: { userId: user.id } } },
        orderBy: { updatedAt: 'asc' },
      });
      if (!inventory) throw new ConflictException('Inventory record is unavailable for this seller variant.');
      const onHand = dto.onHand ?? inventory.onHand;
      const reserved = dto.reserved ?? inventory.reserved;
      const safetyStock = dto.safetyStock ?? inventory.safetyStock;
      if (onHand < reserved + safetyStock) {
        throw new ConflictException('On-hand inventory cannot be lower than reserved plus safety stock.');
      }
      return tx.inventory.update({
        where: { id: inventory.id },
        data: { onHand, reserved, safetyStock },
        include: {
          store: { select: { id: true, name: true, slug: true } },
          warehouse: true,
          variant: { include: { product: { select: { id: true, name: true, slug: true, status: true } } } },
        },
      });
    });
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

  private async releaseVariant(tx: Prisma.TransactionClient, item: ReservationItem): Promise<void> {
    let remaining = item.quantity;
    const inventories = await tx.inventory.findMany({
      where: { variantId: item.variantId, storeId: item.storeId, reserved: { gt: 0 } },
      orderBy: { updatedAt: 'asc' },
    });

    for (const inventory of inventories) {
      if (remaining <= 0) break;
      const releaseQuantity = Math.min(inventory.reserved, remaining);
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { reserved: { decrement: releaseQuantity } },
      });
      remaining -= releaseQuantity;
    }
  }

  private async deductVariant(tx: Prisma.TransactionClient, item: ReservationItem): Promise<void> {
    let remaining = item.quantity;
    const inventories = await tx.inventory.findMany({
      where: { variantId: item.variantId, storeId: item.storeId, reserved: { gt: 0 } },
      orderBy: { updatedAt: 'asc' },
    });

    for (const inventory of inventories) {
      if (remaining <= 0) break;
      const deductQuantity = Math.min(inventory.reserved, remaining);
      const updated = await tx.inventory.updateMany({
        where: { id: inventory.id, reserved: { gte: deductQuantity }, onHand: { gte: deductQuantity } },
        data: { reserved: { decrement: deductQuantity }, onHand: { decrement: deductQuantity } },
      });
      if (updated.count === 0) throw new ConflictException('Inventory changed while capturing payment.');
      remaining -= deductQuantity;
    }

    if (remaining > 0) throw new ConflictException('Reserved inventory is insufficient for deduction.');
  }

  private async getAvailableQuantity(tx: Prisma.TransactionClient, variantId: string, storeId: string): Promise<number> {
    const inventories = await tx.inventory.findMany({
      where: { variantId, storeId },
      select: { onHand: true, reserved: true, safetyStock: true },
    });

    return inventories.reduce((total, inventory) => total + Math.max(0, inventory.onHand - inventory.reserved - inventory.safetyStock), 0);
  }
}
