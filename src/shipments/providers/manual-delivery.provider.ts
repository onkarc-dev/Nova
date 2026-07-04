import { Injectable } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import type { DeliveryProvider, ShipmentProviderInput } from './delivery-provider.interface';

@Injectable()
export class ManualDeliveryProvider implements DeliveryProvider {
  createShipment(input: ShipmentProviderInput): Promise<ShipmentProviderInput> { return Promise.resolve(input); }
  updateShipment(input: ShipmentProviderInput): Promise<ShipmentProviderInput> { return Promise.resolve(input); }
  cancelShipment(input: ShipmentProviderInput): Promise<ShipmentProviderInput> { return Promise.resolve({ ...input, status: ShipmentStatus.CANCELLED }); }
  getTrackingStatus(input: ShipmentProviderInput): Promise<ShipmentProviderInput> { return Promise.resolve(input); }
  estimateDeliveryDate(from = new Date()): Date {
    const eta = new Date(from);
    eta.setDate(eta.getDate() + 5);
    return eta;
  }
}
