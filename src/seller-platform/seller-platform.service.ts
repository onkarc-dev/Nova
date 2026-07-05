import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, SellerStatus, ShipmentStatus } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { PrismaService } from '@database/prisma.service';
import { ShipmentsService } from '@/shipments/shipments.service';
import type { CreateSellerProductDto, UpdateSellerProductDto } from './dto/seller-product.dto';
import type { UpdateSellerInventoryDto } from './dto/seller-inventory.dto';
import type { UpdateSellerPricingDto } from './dto/seller-pricing.dto';
import type { SellerOrderQueryDto, SellerTrackingDto } from './dto/seller-order-query.dto';

@Injectable()
export class SellerPlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shipmentsService: ShipmentsService,
  ) {}

  async dashboard(user: AuthUser) {
    const seller = await this.getApprovedSeller(user.id);
    const storeIds = seller.stores.map((store) => store.id);
    const [productCount, orderItemCount, inventoryCount] = await Promise.all([
      this.prisma.product.count({ where: { storeId: { in: storeIds } } }),
      this.prisma.orderItem.count({ where: { storeId: { in: storeIds } } }),
      this.prisma.inventory.count({ where: { storeId: { in: storeIds } } }),
    ]);

    return {
      seller,
      summary: { stores: seller.stores.length, products: productCount, orderItems: orderItemCount, inventoryRows: inventoryCount },
      pendingActions: seller.stores.filter((store) => !store.isVerified).map((store) => ({ type: 'STORE_VERIFICATION', storeId: store.id })),
    };
  }

  async listProducts(user: AuthUser) {
    const seller = await this.getApprovedSeller(user.id);
    return this.prisma.product.findMany({
      where: { storeId: { in: seller.stores.map((store) => store.id) } },
      orderBy: { updatedAt: 'desc' },
      include: { variants: true, images: true, category: true, brand: true, store: true },
    });
  }

  async createProduct(user: AuthUser, dto: CreateSellerProductDto) {
    await this.assertStoreOwner(user.id, dto.storeId);
    return this.prisma.product.create({
      data: {
        storeId: dto.storeId,
        categoryId: dto.categoryId,
        brandId: dto.brandId ?? null,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        status: dto.status ?? ProductStatus.DRAFT,
      },
    });
  }

  async updateProduct(user: AuthUser, productId: string, dto: UpdateSellerProductDto) {
    const product = await this.getOwnedProduct(user.id, productId);
    return this.prisma.product.update({ where: { id: product.id }, data: dto });
  }

  async listInventory(user: AuthUser) {
    const seller = await this.getApprovedSeller(user.id);
    return this.prisma.inventory.findMany({
      where: { storeId: { in: seller.stores.map((store) => store.id) } },
      include: { variant: { include: { product: true } }, warehouse: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateInventory(user: AuthUser, inventoryId: string, dto: UpdateSellerInventoryDto) {
    const inventory = await this.prisma.inventory.findFirst({
      where: { id: inventoryId, store: { seller: { userId: user.id } } },
    });
    if (!inventory) throw new NotFoundException('Inventory row not found.');
    return this.prisma.inventory.update({ where: { id: inventory.id }, data: dto });
  }

  async updatePricing(user: AuthUser, variantId: string, dto: UpdateSellerPricingDto) {
    const variant = await this.prisma.variant.findFirst({
      where: { id: variantId, product: { store: { seller: { userId: user.id } } } },
    });
    if (!variant) throw new NotFoundException('Variant not found.');
    return this.prisma.variant.update({ where: { id: variant.id }, data: dto });
  }

  async listOrders(user: AuthUser, query: SellerOrderQueryDto = {}) {
    const seller = await this.getApprovedSeller(user.id);
    const storeIds = seller.stores.map((store) => store.id);
    const where = this.sellerOrderWhere(storeIds, query);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: this.orderSort(query.sort),
        skip: (page - 1) * limit,
        take: limit,
        include: this.sellerOrderInclude(storeIds),
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: items.map((order) => this.toSellerOrder(order, storeIds)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async orderSummary(user: AuthUser, query: SellerOrderQueryDto = {}) {
    const seller = await this.getApprovedSeller(user.id);
    const storeIds = seller.stores.map((store) => store.id);
    const where = this.sellerOrderItemWhere(storeIds, query);
    const [sales, orderGroups, byStatus] = await Promise.all([
      this.prisma.orderItem.aggregate({ where, _sum: { totalCents: true, commissionAmountCents: true }, _count: { id: true } }),
      this.prisma.orderItem.groupBy({ by: ['orderId'], where }),
      this.prisma.orderItem.groupBy({ by: ['orderId'], where, _count: { orderId: true } }),
    ]);

    return {
      grossSalesCents: sales._sum.totalCents ?? 0,
      commissionCents: sales._sum.commissionAmountCents ?? 0,
      netSalesCents: (sales._sum.totalCents ?? 0) - (sales._sum.commissionAmountCents ?? 0),
      orderItemCount: sales._count.id,
      orderCount: orderGroups.length,
      buckets: { orderGroups: byStatus.length },
    };
  }

  async getOrderDetail(user: AuthUser, orderId: string) {
    const seller = await this.getApprovedSeller(user.id);
    const storeIds = seller.stores.map((store) => store.id);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, items: { some: { storeId: { in: storeIds } } } },
      include: this.sellerOrderDetailInclude(storeIds),
    });
    if (!order) throw new NotFoundException('Order not found.');
    return { ...this.toSellerOrder(order, storeIds), timeline: this.buildTimeline(order, storeIds) };
  }

  async markOrderPacked(user: AuthUser, orderId: string) {
    const shipment = await this.getOwnedShipmentForOrder(user.id, orderId, [ShipmentStatus.PENDING]);
    return this.shipmentsService.updateSellerStatus(user, shipment.id, { status: ShipmentStatus.PACKED, message: 'Packed by seller.' });
  }

  async markOrderReadyToShip(user: AuthUser, orderId: string) {
    const shipment = await this.getOwnedShipmentForOrder(user.id, orderId, [ShipmentStatus.PACKED]);
    return this.shipmentsService.updateSellerStatus(user, shipment.id, { status: ShipmentStatus.READY_TO_SHIP, message: 'Ready to ship.' });
  }

  async updateOrderTracking(user: AuthUser, orderId: string, dto: SellerTrackingDto) {
    const shipment = await this.getOwnedShipmentForOrder(user.id, orderId);
    return this.shipmentsService.updateSellerTracking(user, shipment.id, dto);
  }

  private async getApprovedSeller(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId }, include: { stores: true } });
    if (!seller) throw new NotFoundException('Seller profile not found.');
    if (seller.status !== SellerStatus.APPROVED) throw new ForbiddenException('Seller profile is not approved.');
    return seller;
  }

  private async assertStoreOwner(userId: string, storeId: string) {
    const store = await this.prisma.store.findFirst({ where: { id: storeId, seller: { userId } } });
    if (!store) throw new NotFoundException('Store not found.');
    return store;
  }

  private async getOwnedProduct(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, store: { seller: { userId } } } });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  private async getOwnedShipmentForOrder(userId: string, orderId: string, statuses?: ShipmentStatus[]) {
    const where: Prisma.ShipmentWhereInput = {
      orderId,
      seller: { userId },
    };
    if (statuses) where.status = { in: statuses };
    const shipment = await this.prisma.shipment.findFirst({
      where,
      orderBy: { createdAt: 'asc' },
    });
    if (!shipment) throw new NotFoundException('Seller shipment not found.');
    return shipment;
  }

  private sellerOrderWhere(storeIds: string[], query: SellerOrderQueryDto): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = { items: { some: this.sellerOrderItemWhere(storeIds, query) } };
    if (query.status) where.status = query.status;
    const placedAt = this.dateRange(query);
    if (placedAt) where.placedAt = placedAt;
    if (query.paymentStatus) where.payments = { some: { status: query.paymentStatus } };
    if (query.shipmentStatus) where.shipments = { some: { status: query.shipmentStatus } };
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { items: { some: { nameSnapshot: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    return where;
  }

  private sellerOrderItemWhere(storeIds: string[], query: SellerOrderQueryDto): Prisma.OrderItemWhereInput {
    const order: Prisma.OrderWhereInput = {};
    if (query.status) order.status = query.status;
    const placedAt = this.dateRange(query);
    if (placedAt) order.placedAt = placedAt;
    if (query.paymentStatus) order.payments = { some: { status: query.paymentStatus } };
    if (query.shipmentStatus) order.shipments = { some: { status: query.shipmentStatus } };

    const where: Prisma.OrderItemWhereInput = { storeId: { in: storeIds } };
    if (Object.keys(order).length > 0) where.order = order;
    if (query.search) where.nameSnapshot = { contains: query.search, mode: 'insensitive' };
    return where;
  }

  private dateRange(query: SellerOrderQueryDto): Prisma.DateTimeFilter | undefined {
    if (!query.from && !query.to) return undefined;
    const filter: Prisma.DateTimeFilter = {};
    if (query.from) filter.gte = new Date(query.from);
    if (query.to) filter.lte = new Date(query.to);
    return filter;
  }

  private orderSort(sort?: SellerOrderQueryDto['sort']): Prisma.OrderOrderByWithRelationInput {
    if (sort === 'oldest') return { placedAt: 'asc' };
    if (sort === 'revenue_asc') return { totalCents: 'asc' };
    if (sort === 'revenue_desc') return { totalCents: 'desc' };
    return { placedAt: 'desc' };
  }

  private sellerOrderInclude(storeIds: string[]) {
    return {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      payments: { orderBy: { createdAt: 'desc' as const } },
      shipments: { where: { storeId: { in: storeIds } }, include: { events: { orderBy: { occurredAt: 'asc' as const } } }, orderBy: { createdAt: 'desc' as const } },
      returns: { orderBy: { createdAt: 'desc' as const } },
      items: {
        where: { storeId: { in: storeIds } },
        include: { product: true, variant: true, store: true },
        orderBy: { id: 'asc' as const },
      },
    } satisfies Prisma.OrderInclude;
  }

  private sellerOrderDetailInclude(storeIds: string[]) {
    return {
      ...this.sellerOrderInclude(storeIds),
      refunds: true,
    } satisfies Prisma.OrderInclude;
  }

  private toSellerOrder(order: Prisma.OrderGetPayload<{ include: ReturnType<SellerPlatformService['sellerOrderInclude']> }>, storeIds: string[]) {
    return {
      ...order,
      items: order.items,
      sellerSummary: {
        grossAmountCents: order.items.reduce((sum, item) => sum + item.totalCents, 0),
        commissionAmountCents: order.items.reduce((sum, item) => sum + item.commissionAmountCents, 0),
        itemCount: order.items.length,
      },
      shipments: order.shipments,
      returns: order.returns,
      storeIds,
    };
  }

  private buildTimeline(
    order: Prisma.OrderGetPayload<{ include: ReturnType<SellerPlatformService['sellerOrderDetailInclude']> }>,
    storeIds: string[],
  ) {
    const events = [
      { type: 'ORDER_PLACED', entityId: order.id, at: order.placedAt, label: 'Order placed' },
      ...order.payments.map((payment) => ({ type: `PAYMENT_${payment.status}`, entityId: payment.id, at: payment.updatedAt, label: `Payment ${payment.status}` })),
      ...order.shipments.flatMap((shipment) =>
        [{ type: `SHIPMENT_${shipment.status}`, entityId: shipment.id, at: shipment.updatedAt, label: `Shipment ${shipment.status}` }],
      ),
      ...order.returns.flatMap((returnRequest) =>
        [{ type: `RETURN_${returnRequest.status}`, entityId: returnRequest.id, at: returnRequest.updatedAt, label: `Return ${returnRequest.status}` }],
      ),
    ];
    const seen = new Set<string>();
    return events
      .filter((event) => {
        const key = `${event.type}:${event.entityId}:${event.at.toISOString()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((left, right) => left.at.getTime() - right.at.getTime())
      .map((event) => ({ ...event, at: event.at.toISOString(), storeIds }));
  }
}
