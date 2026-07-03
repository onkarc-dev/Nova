import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AddressType, CartStatus, OrderStatus, PaymentProvider, PaymentStatus, Prisma, ProductStatus } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { InventoryReservationService } from '@/inventory/inventory-reservation.service';
import type { PaymentService } from '@/payments/payment.service';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { OrdersService } from './orders.service';

interface PrismaMock {
  runInTransaction: jest.Mock<Promise<unknown>, [(tx: TxMock) => Promise<unknown>]>;
  order: TxMock['order'];
}

interface TxMock {
  order: {
    findFirst: jest.Mock<Promise<unknown>, [unknown]>;
    create: jest.Mock<Promise<unknown>, [unknown]>;
  };
  cart: {
    findFirst: jest.Mock<Promise<unknown>, [unknown]>;
    update: jest.Mock<Promise<unknown>, [unknown]>;
  };
  address: {
    findFirst: jest.Mock<Promise<unknown>, [unknown]>;
  };
}

interface InventoryMock {
  validateAvailability: jest.Mock<Promise<void>, [unknown, unknown]>;
  reserveOrderItems: jest.Mock<Promise<void>, [unknown, unknown]>;
}

interface PaymentMock {
  createPendingPayment: jest.Mock<Promise<unknown>, [unknown, unknown]>;
}

const authUser: AuthUser = {
  id: 'user_1',
  email: 'buyer@nova.test',
  roles: ['customer'],
};

const address = {
  id: 'address_1',
  userId: 'user_1',
  type: AddressType.BOTH,
  fullName: 'Buyer One',
  phone: '+919876543210',
  line1: 'Market Road',
  line2: null,
  city: 'Pune',
  state: 'Maharashtra',
  postalCode: '411001',
  countryCode: 'IN',
  isDefault: true,
  createdAt: new Date('2026-07-03T00:00:00.000Z'),
  updatedAt: new Date('2026-07-03T00:00:00.000Z'),
};

function createCart(items: unknown[] = [createCartItem()]) {
  return {
    id: 'cart_1',
    userId: 'user_1',
    sessionId: null,
    status: CartStatus.ACTIVE,
    createdAt: new Date('2026-07-03T00:00:00.000Z'),
    updatedAt: new Date('2026-07-03T00:00:00.000Z'),
    items,
  };
}

function createCartItem(overrides?: Record<string, unknown>) {
  return {
    id: 'cart_item_1',
    cartId: 'cart_1',
    variantId: 'variant_1',
    quantity: 2,
    createdAt: new Date('2026-07-03T00:00:00.000Z'),
    updatedAt: new Date('2026-07-03T00:00:00.000Z'),
    variant: {
      id: 'variant_1',
      productId: 'product_1',
      sku: 'NOVA-SKU-1',
      name: 'Default',
      attributes: {},
      priceCents: 120000,
      compareAtCents: null,
      currency: 'INR',
      isActive: true,
      createdAt: new Date('2026-07-03T00:00:00.000Z'),
      updatedAt: new Date('2026-07-03T00:00:00.000Z'),
      product: {
        id: 'product_1',
        storeId: 'store_1',
        categoryId: 'category_1',
        brandId: null,
        name: 'Nova product',
        slug: 'nova-product',
        description: 'A Nova product',
        status: ProductStatus.ACTIVE,
        seoTitle: null,
        seoDescription: null,
        createdAt: new Date('2026-07-03T00:00:00.000Z'),
        updatedAt: new Date('2026-07-03T00:00:00.000Z'),
        store: {
          id: 'store_1',
          sellerId: 'seller_1',
          name: 'Nova Store',
          slug: 'nova-store',
          description: null,
          logo: null,
          banner: null,
          city: 'Pune',
          state: 'Maharashtra',
          country: 'IN',
          address: 'Market Road',
          postalCode: '411001',
          latitude: null,
          longitude: null,
          isVerified: true,
          createdAt: new Date('2026-07-03T00:00:00.000Z'),
          updatedAt: new Date('2026-07-03T00:00:00.000Z'),
          seller: {
            id: 'seller_1',
            userId: 'seller_user_1',
            businessName: 'Nova Seller',
            legalName: 'Nova Seller Pvt Ltd',
            gstNumber: '27ABCDE1234F1Z5',
            panNumber: 'ABCDE1234F',
            email: 'seller@nova.test',
            phone: '+919876543211',
            status: 'APPROVED',
            commissionRate: new Prisma.Decimal(5),
            createdAt: new Date('2026-07-03T00:00:00.000Z'),
            updatedAt: new Date('2026-07-03T00:00:00.000Z'),
          },
        },
      },
    },
    ...overrides,
  };
}

function createOrder() {
  return {
    id: 'order_1',
    orderNumber: 'NOVA-ORDER-1',
    userId: 'user_1',
    cartId: 'cart_1',
    billingAddressId: 'address_1',
    shippingAddressId: 'address_1',
    status: OrderStatus.PENDING_PAYMENT,
    subtotalCents: 240000,
    discountCents: 0,
    taxCents: 0,
    shippingCents: 0,
    totalCents: 240000,
    currency: 'INR',
    placedAt: new Date('2026-07-03T00:00:00.000Z'),
    updatedAt: new Date('2026-07-03T00:00:00.000Z'),
    shippingAddress: address,
    billingAddress: address,
    payments: [
      {
        id: 'payment_1',
        orderId: 'order_1',
        provider: PaymentProvider.MANUAL_PENDING,
        status: PaymentStatus.PENDING,
        amountCents: 240000,
        currency: 'INR',
        providerRef: null,
        createdAt: new Date('2026-07-03T00:00:00.000Z'),
        updatedAt: new Date('2026-07-03T00:00:00.000Z'),
      },
    ],
    items: [],
  };
}

function createTxMock(): TxMock {
  return {
    order: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
    },
    cart: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
    },
    address: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
    },
  };
}

function createService() {
  const tx = createTxMock();
  const prisma: PrismaMock = {
    runInTransaction: jest.fn<Promise<unknown>, [(tx: TxMock) => Promise<unknown>]>((callback) => callback(tx)),
    order: tx.order,
  };
  const inventory: InventoryMock = {
    validateAvailability: jest.fn<Promise<void>, [unknown, unknown]>(() => Promise.resolve()),
    reserveOrderItems: jest.fn<Promise<void>, [unknown, unknown]>(() => Promise.resolve()),
  };
  const payment: PaymentMock = {
    createPendingPayment: jest.fn<Promise<unknown>, [unknown, unknown]>(() =>
      Promise.resolve({ id: 'payment_1', status: PaymentStatus.PENDING }),
    ),
  };

  return {
    tx,
    prisma,
    inventory,
    payment,
    service: new OrdersService(
      prisma as unknown as PrismaService,
      inventory as unknown as InventoryReservationService,
      payment as unknown as PaymentService,
    ),
  };
}

describe('OrdersService createOrder', () => {
  it('creates a pending-payment order from an owned active cart', async () => {
    const { service, tx, inventory, payment } = createService();
    tx.order.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(createOrder());
    tx.cart.findFirst.mockResolvedValue(createCart());
    tx.address.findFirst.mockResolvedValue(address);
    tx.order.create.mockResolvedValue({ id: 'order_1' });

    const result = await service.createOrder(authUser, {
      cartId: 'cart_1',
      shippingAddressId: 'address_1',
    });

    expect(result.status).toBe(OrderStatus.PENDING_PAYMENT);
    expect(tx.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user_1',
        cartId: 'cart_1',
        status: OrderStatus.PENDING_PAYMENT,
        subtotalCents: 240000,
        totalCents: 240000,
        items: expect.any(Object) as unknown,
      }) as unknown,
      select: { id: true },
    });
    expect(inventory.validateAvailability).toHaveBeenCalledWith(tx, [{ variantId: 'variant_1', storeId: 'store_1', quantity: 2 }]);
    expect(inventory.reserveOrderItems).toHaveBeenCalledWith(tx, [{ variantId: 'variant_1', storeId: 'store_1', quantity: 2 }]);
    expect(payment.createPendingPayment).toHaveBeenCalledWith(tx, { orderId: 'order_1', amountCents: 240000, currency: 'INR' });
    expect(tx.cart.update).toHaveBeenCalledWith({ where: { id: 'cart_1' }, data: { status: CartStatus.CHECKED_OUT } });
  });

  it('blocks duplicate orders for the same cart', async () => {
    const { service, tx } = createService();
    tx.order.findFirst.mockResolvedValue({ id: 'order_existing' });

    await expect(service.createOrder(authUser, { cartId: 'cart_1', shippingAddressId: 'address_1' })).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(tx.cart.findFirst).not.toHaveBeenCalled();
  });

  it('rejects carts that are not owned by the buyer or are no longer active', async () => {
    const { service, tx } = createService();
    tx.order.findFirst.mockResolvedValue(null);
    tx.cart.findFirst.mockResolvedValue(null);
    tx.address.findFirst.mockResolvedValue(address);

    await expect(service.createOrder(authUser, { cartId: 'cart_other', shippingAddressId: 'address_1' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects an empty cart', async () => {
    const { service, tx } = createService();
    tx.order.findFirst.mockResolvedValue(null);
    tx.cart.findFirst.mockResolvedValue(createCart([]));
    tx.address.findFirst.mockResolvedValue(address);

    await expect(service.createOrder(authUser, { cartId: 'cart_1', shippingAddressId: 'address_1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('recalculates pricing from current variant prices', async () => {
    const { service, tx } = createService();
    tx.order.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(createOrder());
    tx.cart.findFirst.mockResolvedValue(createCart([createCartItem({ quantity: 3 })]));
    tx.address.findFirst.mockResolvedValue(address);
    tx.order.create.mockResolvedValue({ id: 'order_1' });

    await service.createOrder(authUser, { cartId: 'cart_1', shippingAddressId: 'address_1' });

    expect(tx.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ subtotalCents: 360000, totalCents: 360000 }) as unknown,
      select: { id: true },
    });
  });

  it('does not create an order when inventory validation fails', async () => {
    const { service, tx, inventory } = createService();
    tx.order.findFirst.mockResolvedValue(null);
    tx.cart.findFirst.mockResolvedValue(createCart());
    tx.address.findFirst.mockResolvedValue(address);
    inventory.validateAvailability.mockRejectedValue(new ConflictException('Insufficient inventory.'));

    await expect(service.createOrder(authUser, { cartId: 'cart_1', shippingAddressId: 'address_1' })).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(tx.order.create).not.toHaveBeenCalled();
  });
});
