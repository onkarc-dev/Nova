import { ConflictException } from '@nestjs/common';
import { ShipmentStatus } from '@prisma/client';
import { ShipmentStateMachine } from './shipment-state-machine';

describe('ShipmentStateMachine', () => {
  const machine = new ShipmentStateMachine();

  it('allows valid delivery transitions', () => {
    expect(machine.canTransition(ShipmentStatus.PENDING, ShipmentStatus.PACKED)).toBe(true);
    expect(machine.canTransition(ShipmentStatus.PACKED, ShipmentStatus.SHIPPED)).toBe(true);
    expect(machine.canTransition(ShipmentStatus.SHIPPED, ShipmentStatus.DELIVERED)).toBe(true);
  });

  it('blocks invalid regressions', () => {
    expect(machine.canTransition(ShipmentStatus.DELIVERED, ShipmentStatus.SHIPPED)).toBe(false);
    expect(() => {
      machine.assertTransition(ShipmentStatus.DELIVERED, ShipmentStatus.SHIPPED);
    }).toThrow(ConflictException);
  });

  it('protects terminal cancelled shipments', () => {
    expect(machine.canTransition(ShipmentStatus.CANCELLED, ShipmentStatus.SHIPPED)).toBe(false);
  });
});
