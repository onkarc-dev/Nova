import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserProfileDto) {
    return this.usersService.updateMe(user, dto);
  }

  @Get('me/addresses')
  listAddresses(@CurrentUser() user: AuthUser) {
    return this.usersService.listMyAddresses(user);
  }

  @Post('me/addresses')
  createAddress(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(user, dto);
  }

  @Patch('me/addresses/:addressId')
  updateAddress(@CurrentUser() user: AuthUser, @Param('addressId') addressId: string, @Body() dto: UpdateAddressDto) {
    return this.usersService.updateAddress(user, addressId, dto);
  }

  @Delete('me/addresses/:addressId')
  deleteAddress(@CurrentUser() user: AuthUser, @Param('addressId') addressId: string) {
    return this.usersService.deleteAddress(user, addressId);
  }

  @Post('me/addresses/:addressId/default')
  setDefaultAddress(@CurrentUser() user: AuthUser, @Param('addressId') addressId: string) {
    return this.usersService.setDefaultAddress(user, addressId);
  }
}
