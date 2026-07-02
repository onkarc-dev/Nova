import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SellerStatus, type Seller, type Store } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import type { CreateStoreDto } from './dto/create-store.dto';
import type { ListSellerApplicationsDto } from './dto/list-seller-applications.dto';
import type { SellerApplicationDto } from './dto/seller-application.dto';
import type { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import type { UpdateStoreDto } from './dto/update-store.dto';

type SellerWithUser = Seller & {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
  };
};

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(user: AuthUser, dto: SellerApplicationDto): Promise<Seller> {
    try {
      return await this.prisma.seller.create({
        data: {
          userId: user.id,
          businessName: dto.businessName,
          legalName: dto.legalName,
          gstNumber: dto.gstNumber.toUpperCase(),
          panNumber: dto.panNumber.toUpperCase(),
          email: dto.email.toLowerCase(),
          phone: dto.phone,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A seller application already exists for this user or business identity.');
      }
      throw error;
    }
  }

  async getMyProfile(user: AuthUser): Promise<Seller> {
    return this.getSellerForUser(user.id);
  }

  async updateMyProfile(user: AuthUser, dto: UpdateSellerProfileDto): Promise<Seller> {
    const seller = await this.getSellerForUser(user.id);
    try {
      return await this.prisma.seller.update({
        where: { id: seller.id },
        data: this.toSellerUpdateData(dto),
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Another seller already uses one of these business identity values.');
      }
      throw error;
    }
  }

  async getMyStores(user: AuthUser): Promise<Store[]> {
    const seller = await this.getSellerForUser(user.id);
    return this.prisma.store.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStore(user: AuthUser, dto: CreateStoreDto): Promise<Store> {
    const seller = await this.getSellerForUser(user.id);
    if (seller.status !== SellerStatus.APPROVED) {
      throw new ForbiddenException('Only approved sellers can create stores.');
    }

    try {
      return await this.prisma.store.create({
        data: {
          sellerId: seller.id,
          ...this.toStoreCreateData(dto),
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A store with this slug already exists.');
      }
      throw error;
    }
  }

  async updateStore(user: AuthUser, storeId: string, dto: UpdateStoreDto): Promise<Store> {
    const seller = await this.getSellerForUser(user.id);
    const store = await this.prisma.store.findFirst({ where: { id: storeId, sellerId: seller.id } });
    if (!store) throw new NotFoundException('Store not found.');

    try {
      return await this.prisma.store.update({
        where: { id: store.id },
        data: this.toStoreUpdateData(dto),
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A store with this slug already exists.');
      }
      throw error;
    }
  }

  async listApplications(query: ListSellerApplicationsDto): Promise<SellerWithUser[]> {
    const args: Prisma.SellerFindManyArgs = {
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    };
    if (query.status) args.where = { status: query.status };
    return this.prisma.seller.findMany(args);
  }

  async approve(sellerId: string): Promise<Seller> {
    return this.updateSellerStatusWithRole(sellerId, SellerStatus.APPROVED, true);
  }

  async reject(sellerId: string): Promise<Seller> {
    return this.updateSellerStatusWithRole(sellerId, SellerStatus.REJECTED, false);
  }

  async suspend(sellerId: string): Promise<Seller> {
    return this.updateSellerStatusWithRole(sellerId, SellerStatus.SUSPENDED, false);
  }

  private async updateSellerStatusWithRole(
    sellerId: string,
    status: SellerStatus,
    assignSellerRole: boolean,
  ): Promise<Seller> {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new NotFoundException('Seller application not found.');

    return this.prisma.runInTransaction(async (tx) => {
      const updatedSeller = await tx.seller.update({
        where: { id: seller.id },
        data: { status },
      });

      if (assignSellerRole) {
        const role = await tx.role.upsert({
          where: { name: 'seller' },
          update: { description: 'Approved marketplace seller' },
          create: { name: 'seller', description: 'Approved marketplace seller' },
        });

        await tx.userRole.upsert({
          where: { userId_roleId: { userId: seller.userId, roleId: role.id } },
          update: {},
          create: { userId: seller.userId, roleId: role.id },
        });
      }

      return updatedSeller;
    });
  }

  private async getSellerForUser(userId: string): Promise<Seller> {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException('Seller profile not found.');
    return seller;
  }

  private toSellerUpdateData(dto: UpdateSellerProfileDto): Prisma.SellerUpdateInput {
    const data: Prisma.SellerUpdateInput = {};
    if (dto.businessName !== undefined) data.businessName = dto.businessName;
    if (dto.legalName !== undefined) data.legalName = dto.legalName;
    if (dto.gstNumber !== undefined) data.gstNumber = dto.gstNumber.toUpperCase();
    if (dto.panNumber !== undefined) data.panNumber = dto.panNumber.toUpperCase();
    if (dto.email !== undefined) data.email = dto.email.toLowerCase();
    if (dto.phone !== undefined) data.phone = dto.phone;
    return data;
  }

  private toStoreCreateData(dto: CreateStoreDto): Prisma.StoreCreateWithoutSellerInput {
    return {
      name: dto.name,
      slug: dto.slug ?? this.slugify(dto.name),
      description: dto.description ?? null,
      logo: dto.logo ?? null,
      banner: dto.banner ?? null,
      city: dto.city,
      state: dto.state,
      country: dto.country ?? 'IN',
      address: dto.address,
      postalCode: dto.postalCode,
      latitude: dto.latitude === undefined ? null : new Prisma.Decimal(dto.latitude),
      longitude: dto.longitude === undefined ? null : new Prisma.Decimal(dto.longitude),
    };
  }

  private toStoreUpdateData(dto: UpdateStoreDto): Prisma.StoreUpdateInput {
    const data: Prisma.StoreUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.logo !== undefined) data.logo = dto.logo;
    if (dto.banner !== undefined) data.banner = dto.banner;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode;
    if (dto.latitude !== undefined) data.latitude = new Prisma.Decimal(dto.latitude);
    if (dto.longitude !== undefined) data.longitude = new Prisma.Decimal(dto.longitude);
    return data;
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
