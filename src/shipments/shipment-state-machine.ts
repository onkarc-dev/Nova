import { ConflictException } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';

export class ShipmentStateMachine {
  private readonly transitions = new Map<ShipmentStatus, ReadonlySet<ShipmentStatus>>([
    [ShipmentStatus.PENDING, new Set([ShipmentStatus.PACKED, ShipmentStatus.READY_TO_SHIP, ShipmentStatus.CANCELLED])],
    [ShipmentStatus.PACKED, new Set([ShipmentStatus.READY_TO_SHIP, ShipmentStatus.SHIPPED, ShipmentStatus.CANCELLED])],
    [ShipmentStatus.READY_TO_SHIP, new Set([ShipmentStatus.SHIPPED, ShipmentStatus.CANCELLED])],
    [ShipmentStatus.SHIPPED, new Set([ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.DELIVERED, ShipmentStatus.FAILED_DELIVERY])],
    [ShipmentStatus.IN_TRANSIT, new Set([ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.DELIVERED, ShipmentStatus.FAILED_DELIVERY])],
    [ShipmentStatus.OUT_FOR_DELIVERY, new Set([ShipmentStatus.DELIVERED, ShipmentStatus.FAILED_DELIVERY])],
    [ShipmentStatus.FAILED_DELIVERY, new Set([ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.RETURN_IN_TRANSIT, ShipmentStatus.RETURN_DELIVERED])],
    [ShipmentStatus.DELIVERED, new Set([ShipmentStatus.RETURN_PICKUP_REQUESTED])],
    [ShipmentStatus.RETURN_PICKUP_REQUESTED, new Set([ShipmentStatus.RETURN_PICKED_UP, ShipmentStatus.CANCELLED])],
    [ShipmentStatus.RETURN_PICKED_UP, new Set([ShipmentStatus.RETURN_IN_TRANSIT, ShipmentStatus.RETURN_DELIVERED])],
    [ShipmentStatus.RETURN_IN_TRANSIT, new Set([ShipmentStatus.RETURN_DELIVERED])],
    [ShipmentStatus.CANCELLED, new Set()],
    [ShipmentStatus.RETURN_DELIVERED, new Set()],
  ]);

  canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
    return from === to || (this.transitions.get(from)?.has(to) ?? false);
  }

  assertTransition(from: ShipmentStatus, to: ShipmentStatus): void {
    if (!this.canTransition(from, to)) throw new ConflictException(`Invalid shipment status transition: ${from} -> ${to}.`);
  }
}
