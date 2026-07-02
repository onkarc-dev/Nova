import { NotFoundException } from '@nestjs/common';
import { AddressType, UserStatus, type Address, type User } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { UsersService } from './users.service';

interface PrismaMock {
  user: {
    findUnique: jest.Mock<Promise<User | null>, [unknown]>;
    update: jest.Mock<Promise<User>, [unknown]>;
  };
  address: {
    findMany: jest.Mock<Promise<Address[]>, [unknown]>;
    create: jest.Mock<Promise<Address>, [unknown]>;
    findFirst: jest.Mock<Promise<Address | null>, [unknown]>;
    update: jest.Mock<Promise<Address>, [unknown]>;
    updateMany: jest.Mock<Promise<{ count: number }>, [unknown]>;
    delete: jest.Mock<Promise<Address>, [unknown]>;
  };
  runInTransaction: jest.Mock<Promise<Address>, [(tx: TransactionMock) => Promise<Address>]>;
}

interface TransactionMock {
  address: {
    create: jest.Mock<Promise<Address>, [unknown]>;
    update: jest.Mock<Promise<Address>, [unknown]>;
    updateMany: jest.Mock<Promise<{ count: number }>, [unknown]>;
  };
}

const authUser: AuthUser = {
  id: 'user_1',
  email: 'buyer@nova.test',
  roles: ['customer'],
};

function createUser(overrides?: Partial<User>): User {
  return {
    id: 'user_1',
    email: 'buyer@nova.test',
    phone: '+919876543210',
    passwordHash: 'hash',
    firstName: 'Buyer',
    lastName: 'One',
    avatarUrl: null,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    lastLoginAt: null,
    createdAt: new Date('2026-07-02T00:00:00.000Z'),
    updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    ...overrides,
  };
}

function createAddress(overrides?: Partial<Address>): Address {
  return {
    id: 'address_1',
    userId: 'user_1',
    type: AddressType.SHIPPING,
    fullName: 'Buyer One',
    phone: '+919876543210',
    line1: 'Market Road',
    line2: null,
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
    countryCode: 'IN',
    isDefault: false,
    createdAt: new Date('2026-07-02T00:00:00.000Z'),
    updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    ...overrides,
  };
}

function createTxMock(result = createAddress({ isDefault: true })): TransactionMock {
  return {
    address: {
      create: jest.fn<Promise<Address>, [unknown]>(() => Promise.resolve(result)),
      update: jest.fn<Promise<Address>, [unknown]>(() => Promise.resolve(result)),
      updateMany: jest.fn<Promise<{ count: number }>, [unknown]>(() => Promise.resolve({ count: 1 })),
    },
  };
}

function createPrismaMock(): PrismaMock {
  return {
    user: {
      findUnique: jest.fn<Promise<User | null>, [unknown]>(),
      update: jest.fn<Promise<User>, [unknown]>(),
    },
    address: {
      findMany: jest.fn<Promise<Address[]>, [unknown]>(),
      create: jest.fn<Promise<Address>, [unknown]>(),
      findFirst: jest.fn<Promise<Address | null>, [unknown]>(),
      update: jest.fn<Promise<Address>, [unknown]>(),
      updateMany: jest.fn<Promise<{ count: number }>, [unknown]>(),
      delete: jest.fn<Promise<Address>, [unknown]>(),
    },
    runInTransaction: jest.fn<Promise<Address>, [(tx: TransactionMock) => Promise<Address>]>(),
  };
}

describe('UsersService', () => {
  it('gets the current user without exposing password hash', async () => {
    const prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue(createUser());
    const service = new UsersService(prisma as unknown as PrismaService);

    const result = await service.getMe(authUser);

    expect(result).toMatchObject({ id: 'user_1', email: 'buyer@nova.test', firstName: 'Buyer' });
    expect('passwordHash' in result).toBe(false);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user_1' } });
  });

  it('updates the current user profile', async () => {
    const prisma = createPrismaMock();
    prisma.user.update.mockResolvedValue(createUser({ firstName: 'Updated', phone: '+919999999999' }));
    const service = new UsersService(prisma as unknown as PrismaService);

    const result = await service.updateMe(authUser, { firstName: 'Updated', phone: '+919999999999' });

    expect(result.firstName).toBe('Updated');
    expect(result.phone).toBe('+919999999999');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { firstName: 'Updated', phone: '+919999999999' },
    });
  });

  it('creates an address for the current user', async () => {
    const prisma = createPrismaMock();
    prisma.address.create.mockResolvedValue(createAddress());
    const service = new UsersService(prisma as unknown as PrismaService);

    const result = await service.createAddress(authUser, {
      fullName: 'Buyer One',
      phone: '+919876543210',
      line1: 'Market Road',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411001',
    });

    expect(result.id).toBe('address_1');
    expect(prisma.address.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user_1',
        type: AddressType.SHIPPING,
        countryCode: 'IN',
        isDefault: false,
      }) as unknown,
    });
  });

  it('updates an owned address', async () => {
    const prisma = createPrismaMock();
    prisma.address.findFirst.mockResolvedValue(createAddress());
    prisma.address.update.mockResolvedValue(createAddress({ city: 'Solapur' }));
    const service = new UsersService(prisma as unknown as PrismaService);

    const result = await service.updateAddress(authUser, 'address_1', { city: 'Solapur' });

    expect(result.city).toBe('Solapur');
    expect(prisma.address.findFirst).toHaveBeenCalledWith({
      where: { id: 'address_1', userId: 'user_1' },
    });
    expect(prisma.address.update).toHaveBeenCalledWith({
      where: { id: 'address_1' },
      data: { city: 'Solapur' },
    });
  });

  it("prevents access to another user's address", async () => {
    const prisma = createPrismaMock();
    prisma.address.findFirst.mockResolvedValue(null);
    const service = new UsersService(prisma as unknown as PrismaService);

    await expect(service.updateAddress(authUser, 'address_other', { city: 'Pune' })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.address.findFirst).toHaveBeenCalledWith({
      where: { id: 'address_other', userId: 'user_1' },
    });
    expect(prisma.address.update).not.toHaveBeenCalled();
  });

  it('sets one address as default and unsets previous defaults for the same user', async () => {
    const prisma = createPrismaMock();
    const tx = createTxMock();
    prisma.address.findFirst.mockResolvedValue(createAddress());
    prisma.runInTransaction.mockImplementation((callback) => callback(tx));
    const service = new UsersService(prisma as unknown as PrismaService);

    const result = await service.setDefaultAddress(authUser, 'address_1');

    expect(result.isDefault).toBe(true);
    expect(tx.address.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user_1', isDefault: true, id: { not: 'address_1' } },
      data: { isDefault: false },
    });
    expect(tx.address.update).toHaveBeenCalledWith({
      where: { id: 'address_1' },
      data: { isDefault: true },
    });
  });

  it('deletes an owned address', async () => {
    const prisma = createPrismaMock();
    const address = createAddress();
    prisma.address.findFirst.mockResolvedValue(address);
    prisma.address.delete.mockResolvedValue(address);
    const service = new UsersService(prisma as unknown as PrismaService);

    await expect(service.deleteAddress(authUser, 'address_1')).resolves.toEqual({ deleted: true });

    expect(prisma.address.delete).toHaveBeenCalledWith({ where: { id: 'address_1' } });
  });
});
