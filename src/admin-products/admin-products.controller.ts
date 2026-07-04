import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { AdminProductStatusDto, ListAdminProductsDto } from './dto/admin-product.dto';
import { AdminProductsService } from './admin-products.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  list(@Query() query: ListAdminProductsDto) {
    return this.adminProductsService.list(query);
  }

  @Post(':productId/approve')
  approve(@Param('productId') productId: string) {
    return this.adminProductsService.approve(productId);
  }

  @Post(':productId/reject')
  reject(@Param('productId') productId: string) {
    return this.adminProductsService.reject(productId);
  }

  @Patch(':productId/status')
  updateStatus(@Param('productId') productId: string, @Body() dto: AdminProductStatusDto) {
    return this.adminProductsService.updateStatus(productId, dto.status);
  }
}

