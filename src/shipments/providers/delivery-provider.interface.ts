import type { ShipmentStatus } from '@prisma/client';

export interface ShipmentProviderInput {
  shipmentId: string;
  status?: ShipmentStatus;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DeliveryProvider {
  createShipment(input: ShipmentProviderInput): Promise<ShipmentProviderInput>;
  updateShipment(input: ShipmentProviderInput): Promise<ShipmentProviderInput>;
  cancelShipment(input: ShipmentProviderInput): Promise<ShipmentProviderInput>;
  getTrackingStatus(input: ShipmentProviderInput): Promise<ShipmentProviderInput>;
  estimateDeliveryDate(from?: Date): Date;
}
