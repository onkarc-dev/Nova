import { PaymentStatus } from '@prisma/client';
import { PaymentStateMachine } from './payment-state-machine';

describe('PaymentStateMachine', () => {
  const machine = new PaymentStateMachine();

  it('allows production payment success transitions', () => {
    expect(machine.canTransition(PaymentStatus.CREATED, PaymentStatus.PENDING)).toBe(true);
    expect(machine.canTransition(PaymentStatus.PENDING, PaymentStatus.AUTHORIZED)).toBe(true);
    expect(machine.canTransition(PaymentStatus.AUTHORIZED, PaymentStatus.CAPTURED)).toBe(true);
  });

  it('blocks invalid terminal transitions', () => {
    expect(machine.canTransition(PaymentStatus.CAPTURED, PaymentStatus.FAILED)).toBe(false);
    expect(() => {
      machine.assertTransition(PaymentStatus.REFUNDED, PaymentStatus.CAPTURED);
    }).toThrow('Invalid payment transition');
  });
});
