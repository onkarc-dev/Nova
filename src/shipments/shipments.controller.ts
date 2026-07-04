import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { UpdateShipmentStatusDto, UpdateShipmentTrackingDto } from './dto/shipment.dto';
import { ShipmentsService } from './shipments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('seller')
@Controller('seller/shipments')
export class SellerShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) { return this.shipmentsService.listSellerShipments(user); }

  @Get(':shipmentId')
  get(@CurrentUser() user: AuthUser, @Param('shipmentId') shipmentId: string) { return this.shipmentsService.getSellerShipment(user, shipmentId); }

  @Patch(':shipmentId/status')
  updateStatus(@CurrentUser() user: AuthUser, @Param('shipmentId') shipmentId: string, @Body() dto: UpdateShipmentStatusDto) { return this.shipmentsService.updateSellerStatus(user, shipmentId, dto); }

  @Patch(':shipmentId/tracking')
  updateTracking(@CurrentUser() user: AuthUser, @Param('shipmentId') shipmentId: string, @Body() dto: UpdateShipmentTrackingDto) { return this.shipmentsService.updateSellerTracking(user, shipmentId, dto); }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/shipments')
export class AdminShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  list() { return this.shipmentsService.listAdminShipments(); }

  @Get(':shipmentId')
  get(@Param('shipmentId') shipmentId: string) { return this.shipmentsService.getAdminShipment(shipmentId); }

  @Patch(':shipmentId/status')
  updateStatus(@Param('shipmentId') shipmentId: string, @Body() dto: UpdateShipmentStatusDto) { return this.shipmentsService.updateAdminStatus(shipmentId, dto); }

  @Patch(':shipmentId/tracking')
  updateTracking(@Param('shipmentId') shipmentId: string, @Body() dto: UpdateShipmentTrackingDto) { return this.shipmentsService.updateAdminTracking(shipmentId, dto); }

  @Post(':shipmentId/cancel')
  cancel(@Param('shipmentId') shipmentId: string) { return this.shipmentsService.cancelAdminShipment(shipmentId); }
}

@UseGuards(JwtAuthGuard)
@Controller()
export class CustomerShipmentTrackingController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get('orders/:orderId/tracking')
  orderTracking(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) { return this.shipmentsService.getOrderTracking(user, orderId); }

  @Get('shipments/:shipmentId/tracking')
  shipmentTracking(@CurrentUser() user: AuthUser, @Param('shipmentId') shipmentId: string) { return this.shipmentsService.getShipmentTracking(user, shipmentId); }
}
