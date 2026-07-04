import { ShipmentProvider, ShipmentStatus } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { NotificationsService } from '@/notifications/notifications.service';
import { ManualDeliveryProvider } from './providers/manual-delivery.provider';
import { ShipmentsService } from './shipments.service';

describe('ShipmentsService timeline', () => {
  it('sorts and deduplicates customer tracking events while hiding metadata', async () => {
    const shipment = {
      id: 'ship_1', orderId: 'order_1', sellerId: 'seller_1', storeId: 'store_1', provider: ShipmentProvider.MANUAL, status: ShipmentStatus.SHIPPED,
      courierName: 'Local', trackingNumber: 'TRK1', trackingUrl: null, estimatedDeliveryAt: null, deliveredAt: null,
      events: [
        { id: 'e2', shipmentId: 'ship_1', status: ShipmentStatus.SHIPPED, message: 'Shipped duplicate', location: null, occurredAt: new Date('2026-01-02'), providerEventId: null, metadata: { internal: true }, createdAt: new Date('2026-01-02') },
        { id: 'e1', shipmentId: 'ship_1', status: ShipmentStatus.PENDING, message: 'Created', location: null, occurredAt: new Date('2026-01-01'), providerEventId: null, metadata: null, createdAt: new Date('2026-01-01') },
        { id: 'e3', shipmentId: 'ship_1', status: ShipmentStatus.SHIPPED, message: 'Shipped', location: null, occurredAt: new Date('2026-01-02'), providerEventId: null, metadata: null, createdAt: new Date('2026-01-02') },
      ],
    };
    const prisma = { shipment: { findFirst: jest.fn().mockResolvedValue(shipment) } };
    const notificationsService = { createFromEventTx: jest.fn().mockResolvedValue([]) };
    const service = new ShipmentsService(
      prisma as unknown as PrismaService,
      new ManualDeliveryProvider(),
      notificationsService as unknown as NotificationsService,
    );

    const result = await service.getShipmentTracking({ id: 'user_1', email: 'u@example.com', roles: ['customer'] }, 'ship_1');

    expect(result.events.map((event) => event.status)).toEqual([ShipmentStatus.PENDING, ShipmentStatus.SHIPPED]);
    expect(result.events[1]).not.toHaveProperty('metadata');
  });
});
