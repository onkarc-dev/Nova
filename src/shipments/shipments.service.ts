import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, OrderStatus, Prisma, ShipmentProvider, ShipmentStatus } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { NotificationsService } from '@/notifications/notifications.service';
import { PrismaService } from '@database/prisma.service';
import { ShipmentStateMachine } from './shipment-state-machine';
import { ManualDeliveryProvider } from './providers/manual-delivery.provider';
import type { UpdateShipmentStatusDto, UpdateShipmentTrackingDto } from './dto/shipment.dto';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);
  private readonly stateMachine = new ShipmentStateMachine();

  constructor(
    private readonly prisma: PrismaService,
    private readonly manualProvider: ManualDeliveryProvider,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createShipmentPlaceholders(tx: Prisma.TransactionClient, orderId: string) {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true, shipments: true } });
    if (!order || order.status === OrderStatus.CANCELLED) return [];
    const groups = new Map<string, { sellerId: string; storeId: string }>();
    for (const item of order.items) groups.set(`${item.sellerId}:${item.storeId}`, { sellerId: item.sellerId, storeId: item.storeId });
    const created = [];
    for (const group of groups.values()) {
      const existing = order.shipments.find((shipment) => shipment.sellerId === group.sellerId && shipment.storeId === group.storeId);
      if (existing) continue;
      const eta = this.manualProvider.estimateDeliveryDate();
      const shipment = await tx.shipment.create({
        data: { orderId, sellerId: group.sellerId, storeId: group.storeId, provider: ShipmentProvider.MANUAL, status: ShipmentStatus.PENDING, estimatedDeliveryAt: eta },
      });
      await this.recordEvent(tx, shipment.id, ShipmentStatus.PENDING, 'Shipment created.', undefined, undefined, undefined, { hook: 'shipment.created' });
      await this.createShipmentNotification(tx, shipment.id, NotificationType.SHIPMENT_CREATED, 'created');
      created.push(shipment);
    }
    return created;
  }

  async createShipmentPlaceholdersSafely(orderId: string) {
    try { return await this.prisma.runInTransaction((tx) => this.createShipmentPlaceholders(tx, orderId)); }
    catch (error) { this.logger.error(`Shipment placeholder creation failed for order ${orderId}.`, error instanceof Error ? error.stack : undefined); return []; }
  }

  listSellerShipments(user: AuthUser) { return this.prisma.shipment.findMany({ where: { seller: { userId: user.id } }, orderBy: { createdAt: 'desc' }, include: this.shipmentInclude() }); }
  async getSellerShipment(user: AuthUser, shipmentId: string) { return this.getShipmentOrThrow({ id: shipmentId, seller: { userId: user.id } }); }
  listAdminShipments() { return this.prisma.shipment.findMany({ orderBy: { createdAt: 'desc' }, include: this.shipmentInclude() }); }
  async getAdminShipment(shipmentId: string) { return this.getShipmentOrThrow({ id: shipmentId }); }

  updateSellerStatus(user: AuthUser, shipmentId: string, dto: UpdateShipmentStatusDto) { return this.updateStatus({ id: shipmentId, seller: { userId: user.id } }, dto, 'seller'); }
  updateAdminStatus(shipmentId: string, dto: UpdateShipmentStatusDto) { return this.updateStatus({ id: shipmentId }, dto, 'admin'); }
  updateSellerTracking(user: AuthUser, shipmentId: string, dto: UpdateShipmentTrackingDto) { return this.updateTracking({ id: shipmentId, seller: { userId: user.id } }, dto, 'seller'); }
  updateAdminTracking(shipmentId: string, dto: UpdateShipmentTrackingDto) { return this.updateTracking({ id: shipmentId }, dto, 'admin'); }
  cancelAdminShipment(shipmentId: string) { return this.updateStatus({ id: shipmentId }, { status: ShipmentStatus.CANCELLED, message: 'Shipment cancelled by admin.' }, 'admin'); }

  async getOrderTracking(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId: user.id }, include: { shipments: { include: { events: true } } } });
    if (!order) throw new NotFoundException('Order not found.');
    return order.shipments.map((shipment) => this.toTrackingDto(shipment));
  }

  async getShipmentTracking(user: AuthUser, shipmentId: string) {
    const shipment = await this.prisma.shipment.findFirst({ where: { id: shipmentId, order: { userId: user.id } }, include: { events: true } });
    if (!shipment) throw new NotFoundException('Shipment not found.');
    return this.toTrackingDto(shipment);
  }

  private async updateStatus(where: Prisma.ShipmentWhereInput, dto: UpdateShipmentStatusDto, actor: 'seller' | 'admin') {
    return this.prisma.runInTransaction(async (tx) => {
      const current = await tx.shipment.findFirst({ where });
      if (!current) throw new NotFoundException('Shipment not found.');
      this.stateMachine.assertTransition(current.status, dto.status);
      if (current.status === dto.status) return this.getShipmentOrThrow({ id: current.id });
      const now = new Date();
      const data: Prisma.ShipmentUpdateInput = { status: dto.status };
      if (dto.status === ShipmentStatus.SHIPPED) data.shippedAt = now;
      if (dto.status === ShipmentStatus.DELIVERED) data.deliveredAt = now;
      if (dto.status === ShipmentStatus.FAILED_DELIVERY) data.failedAt = now;
      if (dto.status === ShipmentStatus.CANCELLED) data.cancelledAt = now;
      await tx.shipment.update({ where: { id: current.id }, data });
      await this.recordEvent(tx, current.id, dto.status, dto.message ?? `Shipment marked ${dto.status}.`, dto.location, dto.occurredAt ? new Date(dto.occurredAt) : now, undefined, { actor, hook: this.hookFor(dto.status) });
      await this.createShipmentNotification(tx, current.id, this.notificationTypeFor(dto.status), dto.status);
      return tx.shipment.findUniqueOrThrow({ where: { id: current.id }, include: this.shipmentInclude() });
    });
  }

  private async updateTracking(where: Prisma.ShipmentWhereInput, dto: UpdateShipmentTrackingDto, actor: 'seller' | 'admin') {
    return this.prisma.runInTransaction(async (tx) => {
      const current = await tx.shipment.findFirst({ where });
      if (!current) throw new NotFoundException('Shipment not found.');
      const data: Prisma.ShipmentUpdateInput = {};
      if (dto.courierName !== undefined) data.courierName = dto.courierName;
      if (dto.trackingNumber !== undefined) data.trackingNumber = dto.trackingNumber;
      if (dto.trackingUrl !== undefined) data.trackingUrl = dto.trackingUrl;
      if (dto.estimatedDeliveryAt !== undefined) data.estimatedDeliveryAt = new Date(dto.estimatedDeliveryAt);
      const updated = await tx.shipment.update({ where: { id: current.id }, data, include: this.shipmentInclude() });
      await this.recordEvent(tx, current.id, current.status, 'Shipment tracking updated.', undefined, new Date(), undefined, { actor, trackingUpdated: true });
      return updated;
    });
  }

  private async getShipmentOrThrow(where: Prisma.ShipmentWhereInput) {
    const shipment = await this.prisma.shipment.findFirst({ where, include: this.shipmentInclude() });
    if (!shipment) throw new NotFoundException('Shipment not found.');
    return shipment;
  }

  private async recordEvent(tx: Prisma.TransactionClient, shipmentId: string, status: ShipmentStatus, message: string, location?: string, occurredAt = new Date(), providerEventId?: string, metadata?: Prisma.InputJsonValue) {
    const data: Prisma.ShipmentEventUncheckedCreateInput = { shipmentId, status, message, occurredAt };
    if (location !== undefined) data.location = location;
    if (providerEventId !== undefined) data.providerEventId = providerEventId;
    if (metadata !== undefined) data.metadata = metadata;
    try { return await tx.shipmentEvent.create({ data }); }
    catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null; throw error; }
  }

  private toTrackingDto(shipment: Prisma.ShipmentGetPayload<{ include: { events: true } }>) {
    const seen = new Set<string>();
    const events = [...shipment.events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime()).filter((event) => {
      const key = `${event.status}:${event.occurredAt.toISOString()}:${event.providerEventId ?? ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(({ status, message, location, occurredAt, createdAt }) => ({ status, message, location, occurredAt, createdAt }));
    return { id: shipment.id, orderId: shipment.orderId, status: shipment.status, courierName: shipment.courierName, trackingNumber: shipment.trackingNumber, trackingUrl: shipment.trackingUrl, estimatedDeliveryAt: shipment.estimatedDeliveryAt, deliveredAt: shipment.deliveredAt, events };
  }

  private shipmentInclude() { return { order: { select: { id: true, orderNumber: true, userId: true, status: true } }, seller: { select: { id: true, businessName: true, userId: true } }, store: { select: { id: true, name: true } }, events: { orderBy: { occurredAt: 'asc' as const } } } satisfies Prisma.ShipmentInclude; }
  private hookFor(status: ShipmentStatus) { return ({ [ShipmentStatus.SHIPPED]: 'shipment.shipped', [ShipmentStatus.OUT_FOR_DELIVERY]: 'shipment.out_for_delivery', [ShipmentStatus.DELIVERED]: 'shipment.delivered', [ShipmentStatus.FAILED_DELIVERY]: 'shipment.failed_delivery' } as Partial<Record<ShipmentStatus, string>>)[status]; }
  private notificationTypeFor(status: ShipmentStatus) { return ({ [ShipmentStatus.SHIPPED]: NotificationType.SHIPMENT_SHIPPED, [ShipmentStatus.OUT_FOR_DELIVERY]: NotificationType.OUT_FOR_DELIVERY, [ShipmentStatus.DELIVERED]: NotificationType.DELIVERED, [ShipmentStatus.FAILED_DELIVERY]: NotificationType.FAILED_DELIVERY } as Partial<Record<ShipmentStatus, NotificationType>>)[status]; }

  private async createShipmentNotification(tx: Prisma.TransactionClient, shipmentId: string, type: NotificationType | undefined, status: ShipmentStatus | 'created') {
    if (!type) return;
    try {
      const shipment = await tx.shipment.findUnique({ where: { id: shipmentId }, include: { order: true } });
      if (!shipment) return;
      await this.notificationsService.createFromEventTx(tx, {
        userId: shipment.order.userId,
        type,
        idempotencyKey: `shipment:${shipment.id}:status:${status}:customer:${shipment.order.userId}`,
        template: { orderNumber: shipment.order.orderNumber, shipmentId: shipment.id, status },
        metadata: { shipmentId: shipment.id, orderId: shipment.orderId, status },
      });
    } catch (error) {
      this.logger.error(`Shipment notification hook failed for ${shipmentId}.`, error instanceof Error ? error.stack : undefined);
    }
  }
}
