import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { CheckoutService } from './checkout.service';
import { ValidateCheckoutDto } from './dto/validate-checkout.dto';

@UseGuards(JwtAuthGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get()
  getCheckout(@CurrentUser() user: AuthUser) {
    return this.checkoutService.getCheckout(user);
  }

  @Post('validate')
  validateCheckout(@CurrentUser() user: AuthUser, @Body() dto: ValidateCheckoutDto) {
    return this.checkoutService.validateCheckout(user, dto);
  }
}
