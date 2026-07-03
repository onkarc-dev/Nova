import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AddressType } from '@prisma/client';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { PrismaService } from '@database/prisma.service';
import { CartService } from '@/cart/cart.service';
import type { ValidateCheckoutDto } from './dto/validate-checkout.dto';

@Injectable()
export class CheckoutService {
  private readonly shippingCents = 0;
  private readonly taxCents = 0;

  constructor(
    private readonly cartService: CartService,
    private readonly prisma: PrismaService,
  ) {}

  async getCheckout(user: AuthUser) {
    const [cart, addresses] = await Promise.all([
      this.cartService.getCart(user),
      this.prisma.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      cart,
      addresses,
      summary: cart.summary,
      pricing: this.createPricing(cart.summary.subtotalCents, cart.summary.currency),
      paymentIntegrationStatus: 'PENDING' as const,
    };
  }

  async validateCheckout(user: AuthUser, dto: ValidateCheckoutDto) {
    const checkout = await this.getCheckout(user);

    if (checkout.cart.items.length === 0) {
      throw new BadRequestException('Cart must contain at least one item before checkout.');
    }

    const shippingAddress = await this.getOwnedAddress(user.id, dto.shippingAddressId);
    if (shippingAddress.type === AddressType.BILLING) {
      throw new BadRequestException('Shipping address must support shipping.');
    }

    const billingAddressId = dto.billingAddressId ?? dto.shippingAddressId;
    const billingAddress = await this.getOwnedAddress(user.id, billingAddressId);
    if (billingAddress.type === AddressType.SHIPPING && dto.billingAddressId) {
      throw new BadRequestException('Billing address must support billing.');
    }

    return {
      ...checkout,
      selectedShippingAddressId: shippingAddress.id,
      selectedBillingAddressId: billingAddress.id,
      readyForPayment: false,
      paymentIntegrationStatus: 'PENDING' as const,
    };
  }

  private async getOwnedAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Address not found.');
    return address;
  }

  private createPricing(subtotalCents: number, currency: string) {
    return {
      subtotalCents,
      taxCents: this.taxCents,
      shippingCents: this.shippingCents,
      discountCents: 0,
      totalCents: subtotalCents + this.taxCents + this.shippingCents,
      currency,
    };
  }
}
