import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { CreateSellerProductDto, UpdateSellerProductDto } from './dto/seller-product.dto';
import { SellerProductsService } from './seller-products.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('seller')
@Controller('seller/products')
export class SellerProductsController {
  constructor(private readonly sellerProductsService: SellerProductsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSellerProductDto) {
    return this.sellerProductsService.create(user, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthUser) {
    return this.sellerProductsService.listMine(user);
  }

  @Get(':id')
  getMine(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sellerProductsService.getMine(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateSellerProductDto) {
    return this.sellerProductsService.update(user, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sellerProductsService.delete(user, id);
  }
}

