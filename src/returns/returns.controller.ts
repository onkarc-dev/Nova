import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { CreateReturnDto, RejectReturnDto } from './dto/return.dto';
import { ReturnsService } from './returns.service';

@UseGuards(JwtAuthGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReturnDto) {
    return this.returnsService.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.returnsService.list(user);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.returnsService.get(user, id);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/returns')
export class AdminReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.returnsService.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectReturnDto) {
    return this.returnsService.reject(id, dto);
  }

  @Post(':id/refund')
  refund(@Param('id') id: string) {
    return this.returnsService.refund(id);
  }
}

