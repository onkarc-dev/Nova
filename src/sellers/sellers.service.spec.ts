import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, SellerStatus, type Seller, type Store } from '@prisma/client';
import type { PrismaService } from '@database/prisma.service';
import type { AuthUser } from '@/auth/interfaces/auth-user.interface';
import { SellersService } from './sellers.service';

interface PrismaMock {
  seller: {
    create: jest.Mock<Promise<Seller>, [unknown]>;
    findUnique: jest.Mock<Promise<Seller | null>, [unknown]>;
    update: jest.Mock<Promise<Seller>, [unknown]>;
    findMany: jest.Mock<Promise<Seller[]>, [unknown]>;
  };
  store: {
    create: jest.Mock<Promise<Store>, [unknown]>;
    findMany: jest.Mock<Promise<Store[]>, [unknown]>;
    findFirst: jest.Mock<Promise<Store | null>, [unknown]>;
    update: jest.Mock<Promise<Store>, [unknown]>;
  };
  runInTransaction: jest.Mock<Promise<Seller>, [(tx: TransactionMock) => Promise<Seller>]>;
}

interface TransactionMock {
  seller: {
    update: jest.Mock<Promise<Seller>, [unknown]>;
  };
  role: {
    upsert: jest.Mock<Promise<{ id: string }>, [unknown]>;
  };
  userRole: {
    upsert: jest.Mock<Promise<unknown>, [unknown]>;
  };
}

const authUser: AuthUser = {
  id: 'user_1',
  email: 'seller@nova.test',
  roles: ['customer'],
};

function createSeller(overrides?: Partial<Seller>): Seller {
  return {
    id: 'seller_1',
    userId: 'user_1',
    businessName: 'Nova Sellers',
    legalName: 'Nova Sellers Private Limited',
    gstNumber: '27ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    email: 'seller@nova.test',
    phone: '+919876543210',
    status: SellerStatus.PENDING,
    commissionRate: new Prisma.Decimal(0),
    createdAt: new Date('2026-07-02T00:00:00.000Z'),
    updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    ...overrides,
  };
}

function createStore(overrides?: Partial<Store>): Store {
  return {
    id: 'store_1',
    sellerId: 'seller_1',
    name: 'Nova Store',
    slug: 'nova-store',
    description: null,
    logo: null,
    banner: null,
    city: 'Pune',
    state: 'Maharashtra',
    country: 'IN',
    address: 'Market Road',
    postalCode: '411001',
    latitude: null,
    longitude: null,
    isVerified: false,
    createdAt: new Date('2026-07-02T00:00:00.000Z'),
    updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    ...overrides,
  };
}

function createTxMock(updatedSeller = createSeller({ status: SellerStatus.APPROVED })): TransactionMock {
  return {
    seller: {
      update: jest.fn<Promise<Seller>, [unknown]>(() => Promise.resolve(updatedSeller)),
    },
    role: {
      upsert: jest.fn<Promise<{ id: string }>, [unknown]>(() => Promise.resolve({ id: 'role_seller' })),
    },
    userRole: {
      upsert: jest.fn<Promise<unknown>, [unknown]>(() => Promise.resolve({ userId: 'user_1', roleId: 'role_seller' })),
    },
  };
}

function createPrismaMock(): PrismaMock {
  return {
    seller: {
      create: jest.fn<Promise<Seller>, [unknown]>(),
      findUnique: jest.fn<Promise<Seller | null>, [unknown]>(),
      update: jest.fn<Promise<Seller>, [unknown]>(),
      findMany: jest.fn<Promise<Seller[]>, [unknown]>(),
    },
    store: {
      create: jest.fn<Promise<Store>, [unknown]>(),
      findMany: jest.fn<Promise<Store[]>, [unknown]>(),
      findFirst: jest.fn<Promise<Store | null>, [unknown]>(),
      update: jest.fn<Promise<Store>, [unknown]>(),
    },
    runInTransaction: jest.fn<Promise<Seller>, [(tx: TransactionMock) => Promise<Seller>]>(),
  };
}

describe('SellersService', () => {
  it('creates a seller application for the authenticated user', async () => {
    const prisma = createPrismaMock();
    prisma.seller.create.mockResolvedValue(createSeller());
    const service = new SellersService(prisma as unknown as PrismaService);

    const result = await service.apply(authUser, {
      businessName: 'Nova Sellers',
      legalName: 'Nova Sellers Private Limited',
      gstNumber: '27abcde1234f1z5',
      panNumber: 'abcde1234f',
      email: 'SELLER@nova.test',
      phone: '+919876543210',
    });

    expect(result.id).toBe('seller_1');
    expect(prisma.seller.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user_1',
        gstNumber: '27ABCDE1234F1Z5',
        panNumber: 'ABCDE1234F',
        email: 'seller@nova.test',
      }) as unknown,
    });
  });

  it('prevents duplicate seller applications', async () => {
    const prisma = createPrismaMock();
    prisma.seller.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    const service = new SellersService(prisma as unknown as PrismaService);

    await expect(
      service.apply(authUser, {
        businessName: 'Nova Sellers',
        legalName: 'Nova Sellers Private Limited',
        gstNumber: '27ABCDE1234F1Z5',
        panNumber: 'ABCDE1234F',
        email: 'seller@nova.test',
        phone: '+919876543210',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('approves a seller and assigns the seller role', async () => {
    const prisma = createPrismaMock();
    const tx = createTxMock();
    prisma.seller.findUnique.mockResolvedValue(createSeller());
    prisma.runInTransaction.mockImplementation((callback) => callback(tx));
    const service = new SellersService(prisma as unknown as PrismaService);

    const result = await service.approve('seller_1');

    expect(result.status).toBe(SellerStatus.APPROVED);
    expect(tx.seller.update).toHaveBeenCalledWith({
      where: { id: 'seller_1' },
      data: { status: SellerStatus.APPROVED },
    });
    expect(tx.userRole.upsert).toHaveBeenCalled();
  });

  it('rejects and suspends seller applications without assigning seller role', async () => {
    const prisma = createPrismaMock();
    const rejectTx = createTxMock(createSeller({ status: SellerStatus.REJECTED }));
    const suspendTx = createTxMock(createSeller({ status: SellerStatus.SUSPENDED }));
    prisma.seller.findUnique.mockResolvedValue(createSeller());
    prisma.runInTransaction.mockImplementationOnce((callback) => callback(rejectTx));
    prisma.runInTransaction.mockImplementationOnce((callback) => callback(suspendTx));
    const service = new SellersService(prisma as unknown as PrismaService);

    await expect(service.reject('seller_1')).resolves.toMatchObject({ status: SellerStatus.REJECTED });
    await expect(service.suspend('seller_1')).resolves.toMatchObject({ status: SellerStatus.SUSPENDED });

    expect(rejectTx.userRole.upsert).not.toHaveBeenCalled();
    expect(suspendTx.userRole.upsert).not.toHaveBeenCalled();
  });

  it('allows approved sellers to create stores', async () => {
    const prisma = createPrismaMock();
    prisma.seller.findUnique.mockResolvedValue(createSeller({ status: SellerStatus.APPROVED }));
    prisma.store.create.mockResolvedValue(createStore());
    const service = new SellersService(prisma as unknown as PrismaService);

    const result = await service.createStore(authUser, {
      name: 'Nova Store',
      city: 'Pune',
      state: 'Maharashtra',
      address: 'Market Road',
      postalCode: '411001',
    });

    expect(result.slug).toBe('nova-store');
    expect(prisma.store.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sellerId: 'seller_1',
        slug: 'nova-store',
      }) as unknown,
    });
  });

  it('blocks unapproved sellers from creating stores', async () => {
    const prisma = createPrismaMock();
    prisma.seller.findUnique.mockResolvedValue(createSeller({ status: SellerStatus.PENDING }));
    const service = new SellersService(prisma as unknown as PrismaService);

    await expect(
      service.createStore(authUser, {
        name: 'Nova Store',
        city: 'Pune',
        state: 'Maharashtra',
        address: 'Market Road',
        postalCode: '411001',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not allow users to update stores owned by another seller', async () => {
    const prisma = createPrismaMock();
    prisma.seller.findUnique.mockResolvedValue(createSeller({ status: SellerStatus.APPROVED }));
    prisma.store.findFirst.mockResolvedValue(null);
    const service = new SellersService(prisma as unknown as PrismaService);

    await expect(service.updateStore(authUser, 'store_other', { name: 'New Store Name' })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.store.findFirst).toHaveBeenCalledWith({
      where: { id: 'store_other', sellerId: 'seller_1' },
    });
  });
});
