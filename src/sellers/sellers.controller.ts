import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { CreateStoreDto } from './dto/create-store.dto';
import { ListSellerApplicationsDto } from './dto/list-seller-applications.dto';
import { SellerApplicationDto } from './dto/seller-application.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { SellersService } from './sellers.service';

@UseGuards(JwtAuthGuard)
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post('applications')
  apply(@CurrentUser() user: AuthUser, @Body() dto: SellerApplicationDto) {
    return this.sellersService.apply(user, dto);
  }

  @Get('me')
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.sellersService.getMyProfile(user);
  }

  @Patch('me')
  updateMyProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateSellerProfileDto) {
    return this.sellersService.updateMyProfile(user, dto);
  }

  @Get('me/stores')
  getMyStores(@CurrentUser() user: AuthUser) {
    return this.sellersService.getMyStores(user);
  }

  @Post('me/stores')
  createStore(@CurrentUser() user: AuthUser, @Body() dto: CreateStoreDto) {
    return this.sellersService.createStore(user, dto);
  }

  @Patch('me/stores/:storeId')
  updateStore(@CurrentUser() user: AuthUser, @Param('storeId') storeId: string, @Body() dto: UpdateStoreDto) {
    return this.sellersService.updateStore(user, storeId, dto);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/sellers')
export class AdminSellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get('applications')
  listApplications(@Query() query: ListSellerApplicationsDto) {
    return this.sellersService.listApplications(query);
  }

  @Get()
  listSellers(@Query() query: ListSellerApplicationsDto) {
    return this.sellersService.listApplications(query);
  }

  @Post(':sellerId/approve')
  approve(@Param('sellerId') sellerId: string) {
    return this.sellersService.approve(sellerId);
  }

  @Post(':sellerId/reject')
  reject(@Param('sellerId') sellerId: string) {
    return this.sellersService.reject(sellerId);
  }

  @Post(':sellerId/suspend')
  suspend(@Param('sellerId') sellerId: string) {
    return this.sellersService.suspend(sellerId);
  }
}
