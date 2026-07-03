import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AddressType, CartStatus, OrderStatus, Prisma, ProductStatus } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { PrismaService } from '@database/prisma.service';
import { InventoryReservationService } from '@/inventory/inventory-reservation.service';
import { PaymentService } from '@/payments/payment.service';
import type { CreateOrderDto } from './dto/create-order.dto';

export type OrderDto = Prisma.OrderGetPayload<{ include: ReturnType<OrdersService['orderInclude']> }>;
type CartForOrder = Prisma.CartGetPayload<{ include: ReturnType<OrdersService['cartForOrderInclude']> }>;

@Injectable()
export class OrdersService {
  private readonly shippingCents = 0;
  private readonly taxCents = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryReservationService: InventoryReservationService,
    private readonly paymentService: PaymentService,
  ) {}

  async listOrders(user: AuthUser): Promise<OrderDto[]> {
    return this.prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: 'desc' },
      include: this.orderInclude(),
    });
  }

  async getOrder(user: AuthUser, orderId: string): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: this.orderInclude(),
    });

    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  async createOrder(user: AuthUser, dto: CreateOrderDto): Promise<OrderDto> {
    return this.prisma.runInTransaction(async (tx) => {
      const existingOrder = await tx.order.findFirst({ where: { cartId: dto.cartId, userId: user.id }, select: { id: true } });
      if (existingOrder) throw new ConflictException('An order has already been created for this cart.');

      const [cart, shippingAddress, billingAddress] = await Promise.all([
        this.getOwnedActiveCart(tx, user.id, dto.cartId),
        this.getOwnedAddress(tx, user.id, dto.shippingAddressId),
        this.getOwnedAddress(tx, user.id, dto.billingAddressId ?? dto.shippingAddressId),
      ]);

      if (shippingAddress.type === AddressType.BILLING) {
        throw new BadRequestException('Shipping address must support shipping.');
      }
      if (dto.billingAddressId && billingAddress.type === AddressType.SHIPPING) {
        throw new BadRequestException('Billing address must support billing.');
      }
      if (cart.items.length === 0) {
        throw new BadRequestException('Cart must contain at least one item before creating an order.');
      }

      this.validateCartForOrder(cart);

      const inventoryItems = cart.items.map((item) => ({
        variantId: item.variantId,
        storeId: item.variant.product.storeId,
        quantity: item.quantity,
      }));
      await this.inventoryReservationService.validateAvailability(tx, inventoryItems);

      const subtotalCents = cart.items.reduce((total, item) => total + item.quantity * item.variant.priceCents, 0);
      const currency = this.resolveCurrency(cart);
      const totalCents = subtotalCents + this.taxCents + this.shippingCents;

      const order = await tx.order.create({
        data: {
          orderNumber: this.createOrderNumber(),
          userId: user.id,
          cartId: cart.id,
          billingAddressId: billingAddress.id,
          shippingAddressId: shippingAddress.id,
          status: OrderStatus.PENDING_PAYMENT,
          subtotalCents,
          discountCents: 0,
          taxCents: this.taxCents,
          shippingCents: this.shippingCents,
          totalCents,
          currency,
          items: {
            create: cart.items.map((item) => {
              const product = item.variant.product;
              const store = product.store;
              const seller = store.seller;
              const commissionRate = seller.commissionRate;
              const totalItemCents = item.quantity * item.variant.priceCents;
              return {
                sellerId: seller.id,
                storeId: store.id,
                productId: product.id,
                variantId: item.variant.id,
                skuSnapshot: item.variant.sku,
                nameSnapshot: `${product.name} - ${item.variant.name}`,
                storeNameSnapshot: store.name,
                sellerNameSnapshot: seller.businessName,
                quantity: item.quantity,
                unitPriceCents: item.variant.priceCents,
                totalCents: totalItemCents,
                commissionRateSnapshot: commissionRate,
                commissionAmountCents: Math.round((totalItemCents * Number(commissionRate)) / 100),
              };
            }),
          },
        },
        select: { id: true },
      });

      await this.inventoryReservationService.reserveOrderItems(tx, inventoryItems);
      await this.paymentService.createPendingPayment(tx, { orderId: order.id, amountCents: totalCents, currency });
      await tx.cart.update({ where: { id: cart.id }, data: { status: CartStatus.CHECKED_OUT } });

      const createdOrder = await tx.order.findFirst({
        where: { id: order.id, userId: user.id },
        include: this.orderInclude(),
      });

      if (!createdOrder) throw new NotFoundException('Order not found.');
      return createdOrder;
    });
  }

  private async getOwnedActiveCart(tx: Prisma.TransactionClient, userId: string, cartId: string): Promise<CartForOrder> {
    const cart = await tx.cart.findFirst({
      where: { id: cartId, userId, status: CartStatus.ACTIVE },
      include: this.cartForOrderInclude(),
    });

    if (!cart) throw new NotFoundException('Active cart not found.');
    return cart;
  }

  private async getOwnedAddress(tx: Prisma.TransactionClient, userId: string, addressId: string) {
    const address = await tx.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Address not found.');
    return address;
  }

  private validateCartForOrder(cart: CartForOrder): void {
    for (const item of cart.items) {
      if (item.quantity < 1) throw new BadRequestException('Cart item quantity must be at least one.');
      if (!item.variant.isActive) throw new ConflictException('A cart item is no longer available.');
      if (item.variant.product.status !== ProductStatus.ACTIVE) throw new ConflictException('A cart product is no longer active.');
      if (!item.variant.product.store.isVerified) throw new ConflictException('A cart store is no longer available.');
    }
  }

  private resolveCurrency(cart: CartForOrder): string {
    const currency = cart.items[0]?.variant.currency ?? 'INR';
    const hasMixedCurrency = cart.items.some((item) => item.variant.currency !== currency);
    if (hasMixedCurrency) throw new BadRequestException('A single order cannot contain multiple currencies.');
    return currency;
  }

  private createOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `NOVA-${timestamp}-${random}`;
  }

  private cartForOrderInclude() {
    return {
      items: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  store: {
                    include: {
                      seller: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    } satisfies Prisma.CartInclude;
  }

  private orderInclude() {
    return {
      shippingAddress: true,
      billingAddress: true,
      payments: { orderBy: { createdAt: 'desc' as const } },
      items: {
        orderBy: { id: 'asc' as const },
        include: {
          product: { include: { images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }], take: 1 } } },
          variant: true,
          store: { select: { id: true, name: true, slug: true } },
        },
      },
    } satisfies Prisma.OrderInclude;
  }
}
