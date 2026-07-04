import { Body, Controller, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { CreatePaymentDto, RazorpayWebhookDto, VerifyPaymentDto } from './dto/payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.paymentService.createForOrder(user, dto.orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verify(@Body() dto: VerifyPaymentDto) {
    return this.paymentService.verify(dto.paymentId, dto.providerRef);
  }

  @Post('webhook/razorpay')
  razorpayWebhook(@Req() request: Request, @Headers('x-razorpay-signature') signature: string | undefined, @Body() dto: RazorpayWebhookDto) {
    return this.paymentService.handleRazorpayWebhook(JSON.stringify(request.body), signature, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':paymentId/refund')
  refund(@CurrentUser() user: AuthUser, @Param('paymentId') paymentId: string) {
    return this.paymentService.refund(user, paymentId);
  }
}
