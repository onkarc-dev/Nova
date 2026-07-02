import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AddressType, Prisma, type Address, type User, type UserStatus } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import type { CreateAddressDto } from './dto/create-address.dto';
import type { UpdateAddressDto } from './dto/update-address.dto';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';

export interface UserProfileDto {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(user: AuthUser): Promise<UserProfileDto> {
    const foundUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!foundUser) throw new NotFoundException('User profile not found.');
    return this.toProfileDto(foundUser);
  }

  async updateMe(user: AuthUser, dto: UpdateUserProfileDto): Promise<UserProfileDto> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: this.toUserUpdateData(dto),
      });
      return this.toProfileDto(updatedUser);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Another user already uses this phone number.');
      }
      throw error;
    }
  }

  async listMyAddresses(user: AuthUser): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(user: AuthUser, dto: CreateAddressDto): Promise<Address> {
    const data = this.toAddressCreateData(user.id, dto);
    if (!dto.isDefault) {
      return this.prisma.address.create({ data });
    }

    return this.prisma.runInTransaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
      return tx.address.create({ data });
    });
  }

  async updateAddress(user: AuthUser, addressId: string, dto: UpdateAddressDto): Promise<Address> {
    const address = await this.getOwnedAddress(user.id, addressId);
    const data = this.toAddressUpdateData(dto);

    if (dto.isDefault === true) {
      return this.prisma.runInTransaction(async (tx) => {
        await tx.address.updateMany({
          where: { userId: user.id, isDefault: true, id: { not: address.id } },
          data: { isDefault: false },
        });
        return tx.address.update({ where: { id: address.id }, data });
      });
    }

    return this.prisma.address.update({ where: { id: address.id }, data });
  }

  async deleteAddress(user: AuthUser, addressId: string): Promise<{ deleted: true }> {
    const address = await this.getOwnedAddress(user.id, addressId);
    await this.prisma.address.delete({ where: { id: address.id } });
    return { deleted: true };
  }

  async setDefaultAddress(user: AuthUser, addressId: string): Promise<Address> {
    const address = await this.getOwnedAddress(user.id, addressId);
    return this.prisma.runInTransaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: address.id } },
        data: { isDefault: false },
      });
      return tx.address.update({ where: { id: address.id }, data: { isDefault: true } });
    });
  }

  private async getOwnedAddress(userId: string, addressId: string): Promise<Address> {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new NotFoundException('Address not found.');
    return address;
  }

  private toUserUpdateData(dto: UpdateUserProfileDto): Prisma.UserUpdateInput {
    const data: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    return data;
  }

  private toAddressCreateData(userId: string, dto: CreateAddressDto): Prisma.AddressUncheckedCreateInput {
    return {
      userId,
      type: dto.type ?? AddressType.SHIPPING,
      fullName: dto.fullName,
      phone: dto.phone,
      line1: dto.line1,
      line2: dto.line2 ?? null,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      countryCode: dto.countryCode ?? 'IN',
      isDefault: dto.isDefault ?? false,
    };
  }

  private toAddressUpdateData(dto: UpdateAddressDto): Prisma.AddressUpdateInput {
    const data: Prisma.AddressUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.line1 !== undefined) data.line1 = dto.line1;
    if (dto.line2 !== undefined) data.line2 = dto.line2;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode;
    if (dto.countryCode !== undefined) data.countryCode = dto.countryCode;
    if (dto.isDefault !== undefined) data.isDefault = dto.isDefault;
    return data;
  }

  private toProfileDto(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
