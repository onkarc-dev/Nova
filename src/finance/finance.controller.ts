import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import {
  CommissionQueryDto,
  FinancePeriodQueryDto,
  GenerateSettlementsDto,
  SettlementQueryDto,
  UpdateSettlementStatusDto,
} from './dto/finance-query.dto';
import { FinanceService } from './finance.service';

@UseGuards(JwtAuthGuard)
@Controller('seller')
export class FinanceSellerController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('revenue')
  revenue(@CurrentUser() user: AuthUser, @Query() query: FinancePeriodQueryDto) {
    return this.financeService.getSellerRevenue(user, query);
  }

  @Get('commissions')
  commissions(@CurrentUser() user: AuthUser, @Query() query: CommissionQueryDto) {
    return this.financeService.listSellerCommissions(user, query);
  }

  @Get('payout-summary')
  payoutSummary(@CurrentUser() user: AuthUser) {
    return this.financeService.getSellerPayoutSummary(user);
  }

  @Get('settlements')
  settlements(@CurrentUser() user: AuthUser, @Query() query: SettlementQueryDto) {
    return this.financeService.listSellerSettlements(user, query);
  }

  @Get('settlements/:settlementId')
  settlement(@CurrentUser() user: AuthUser, @Param('settlementId') settlementId: string) {
    return this.financeService.getSellerSettlement(user, settlementId);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class FinanceAdminController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('commissions')
  commissions(@Query() query: CommissionQueryDto) {
    return this.financeService.listAdminCommissions(query);
  }

  @Get('settlements')
  settlements(@Query() query: SettlementQueryDto) {
    return this.financeService.listAdminSettlements(query);
  }

  @Get('settlements/:settlementId')
  settlement(@Param('settlementId') settlementId: string) {
    return this.financeService.getAdminSettlement(settlementId);
  }

  @Post('settlements/generate')
  generateSettlements(@Body() dto: GenerateSettlementsDto) {
    return this.financeService.generateSettlements(dto);
  }

  @Patch('settlements/:settlementId/status')
  updateSettlementStatus(@Param('settlementId') settlementId: string, @Body() dto: UpdateSettlementStatusDto) {
    return this.financeService.updateSettlementStatus(settlementId, dto);
  }

  @Get('finance/overview')
  overview(@Query() query: FinancePeriodQueryDto) {
    return this.financeService.getAdminFinanceOverview(query);
  }

  @Get('seller-earnings')
  sellerEarnings(@Query() query: FinancePeriodQueryDto) {
    return this.financeService.getAdminSellerEarnings(query);
  }
}
