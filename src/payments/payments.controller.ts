import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { CreatePaymentDto, ExpirePaymentsDto, ListPaymentsDto, RazorpayWebhookDto, RefundPaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import { PaymentService } from './payment.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

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
    return this.paymentService.verify(dto);
  }

  @Post('webhook/razorpay')
  razorpayWebhook(@Req() request: RawBodyRequest, @Headers('x-razorpay-signature') signature: string | undefined, @Body() dto: RazorpayWebhookDto) {
    const rawBody = request.rawBody?.toString('utf8') ?? JSON.stringify(request.body);
    return this.paymentService.handleRazorpayWebhook(rawBody, signature, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':paymentId/status')
  status(@CurrentUser() user: AuthUser, @Param('paymentId') paymentId: string) {
    return this.paymentService.getStatus(user, paymentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post(':paymentId/refund')
  refund(@CurrentUser() user: AuthUser, @Param('paymentId') paymentId: string, @Body() dto: RefundPaymentDto) {
    return this.paymentService.refund(user, paymentId, dto);
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminPaymentsController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('payments')
  listPayments(@Query() query: ListPaymentsDto) {
    return this.paymentService.listAdminPayments(query);
  }

  @Get('payments/:paymentId')
  getPayment(@Param('paymentId') paymentId: string) {
    return this.paymentService.getAdminPayment(paymentId);
  }

  @Post('payments/:paymentId/refund')
  refund(@CurrentUser() user: AuthUser, @Param('paymentId') paymentId: string, @Body() dto: RefundPaymentDto) {
    return this.paymentService.refund(user, paymentId, dto);
  }

  @Get('refunds')
  listRefunds() {
    return this.paymentService.listAdminRefunds();
  }

  @Post('payments/expire')
  expirePayments(@Body() dto: ExpirePaymentsDto) {
    return this.paymentService.expirePendingPayments(dto.limit);
  }
}
