import 'reflect-metadata';
import { ValidationPipe, VersioningType, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SellerStatus, type Address, type Seller, type Store } from '@prisma/client';
import { ApiResponseInterceptor } from '@common/interceptors/api-response.interceptor';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import type { Environment } from '@config/environment';
import { PrismaService } from '@database/prisma.service';

interface ApiSuccess<T> {
  success: true;
  data: T;
  metadata: Record<string, unknown>;
}

interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
  };
  metadata: Record<string, unknown>;
}

interface HttpResult<T> {
  status: number;
  body: ApiSuccess<T> | ApiFailure;
}

interface AuthUserResponse {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
}

interface AuthResponse {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
}

interface UserProfileResponse {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string;
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

jest.setTimeout(60_000);

describeWithDatabase('Phase 1 core flows integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseUrl: string;

  const suffix = `${String(Date.now())}-${String(Math.floor(Math.random() * 1_000_000))}`;
  const buyerEmail = `buyer-${suffix}@integration.nova.test`;
  const otherEmail = `other-${suffix}@integration.nova.test`;
  const sellerEmail = `seller-${suffix}@integration.nova.test`;
  const unapprovedSellerEmail = `seller-pending-${suffix}@integration.nova.test`;
  const rejectedSellerEmail = `seller-rejected-${suffix}@integration.nova.test`;
  const suspendedSellerEmail = `seller-suspended-${suffix}@integration.nova.test`;
  const adminEmail = `admin-${suffix}@integration.nova.test`;
  const password = 'StrongPassword123!';

  beforeAll(async () => {
    if (!testDatabaseUrl) return;

    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.DIRECT_URL = testDatabaseUrl;
    process.env.APP_URL = 'http://localhost:3000';
    process.env.API_URL = 'http://localhost:4000';
    process.env.CORS_ORIGINS = 'http://localhost:3000';
    process.env.JWT_ACCESS_SECRET = 'integration-access-secret-with-32-characters';
    process.env.JWT_REFRESH_SECRET = 'integration-refresh-secret-with-32-characters';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '30d';
    process.env.REDIS_URL = 'redis://localhost:6379';

    const { AppModule } = await import('@/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();

    const config = app.get(ConfigService<Environment, true>);
    app.setGlobalPrefix(config.get('API_PREFIX', { infer: true }));
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: config.get('API_VERSION', { infer: true }),
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ApiResponseInterceptor());

    await app.init();
    await app.listen(0);
    prisma = app.get(PrismaService);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await cleanupIntegrationData(prisma, suffix);
    await app.close();
  });

  it('covers register, login, refresh, auth/me, and logout', async () => {
    const registered = await registerUser(buyerEmail, 'Buyer', 'Integration');

    expect(registered.status).toBe(201);
    const registeredData = unwrapSuccess<AuthResponse>(registered);
    expect(registeredData.user.email).toBe(buyerEmail);
    expect(registeredData.accessToken).toEqual(expect.any(String));
    expect(registeredData.refreshToken).toEqual(expect.any(String));

    const login = await post<AuthResponse>('/auth/login', {
      email: buyerEmail,
      password,
    });
    expect(login.status).toBe(201);
    const loginData = unwrapSuccess<AuthResponse>(login);

    const me = await get<AuthUserResponse>('/auth/me', loginData.accessToken);
    expect(me.status).toBe(200);
    expect(unwrapSuccess<AuthUserResponse>(me)).toMatchObject({
      email: buyerEmail,
      roles: ['customer'],
    });

    const refreshed = await post<AuthResponse>('/auth/refresh', {
      refreshToken: loginData.refreshToken,
    });
    expect(refreshed.status).toBe(201);
    const refreshedData = unwrapSuccess<AuthResponse>(refreshed);
    expect(refreshedData.refreshToken).not.toBe(loginData.refreshToken);

    const logout = await post<{ revoked: true }>(
      '/auth/logout',
      { refreshToken: refreshedData.refreshToken },
      refreshedData.accessToken,
    );
    expect(logout.status).toBe(201);
    expect(unwrapSuccess<{ revoked: true }>(logout)).toEqual({ revoked: true });
  });

  it('covers profile and owned address flows', async () => {
    const buyer = unwrapSuccess<AuthResponse>(await registerUser(otherEmail, 'Address', 'Owner'));
    const intruder = unwrapSuccess<AuthResponse>(await registerUser(`intruder-${suffix}@integration.nova.test`, 'Bad', 'Actor'));

    const profile = await get<UserProfileResponse>('/users/me', buyer.accessToken);
    expect(profile.status).toBe(200);
    expect(unwrapSuccess<UserProfileResponse>(profile).email).toBe(otherEmail);

    const updatedProfile = await patch<UserProfileResponse>(
      '/users/me',
      { firstName: 'Updated', phone: '+919876543210' },
      buyer.accessToken,
    );
    expect(updatedProfile.status).toBe(200);
    expect(unwrapSuccess<UserProfileResponse>(updatedProfile)).toMatchObject({
      firstName: 'Updated',
      phone: '+919876543210',
    });

    const firstAddress = await post<Address>(
      '/users/me/addresses',
      {
        type: 'SHIPPING',
        fullName: 'Address Owner',
        phone: '+919876543210',
        line1: 'Market Road 1',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411001',
        countryCode: 'IN',
        isDefault: true,
      },
      buyer.accessToken,
    );
    expect(firstAddress.status).toBe(201);
    const firstAddressData = unwrapSuccess<Address>(firstAddress);
    expect(firstAddressData.isDefault).toBe(true);

    const updatedAddress = await patch<Address>(
      `/users/me/addresses/${firstAddressData.id}`,
      { city: 'Solapur', type: 'BOTH' },
      buyer.accessToken,
    );
    expect(updatedAddress.status).toBe(200);
    expect(unwrapSuccess<Address>(updatedAddress)).toMatchObject({
      city: 'Solapur',
      type: 'BOTH',
    });

    const blocked = await patch<Address>(
      `/users/me/addresses/${firstAddressData.id}`,
      { city: 'Mumbai' },
      intruder.accessToken,
    );
    expect(blocked.status).toBe(404);

    const secondAddress = await post<Address>(
      '/users/me/addresses',
      {
        type: 'BILLING',
        fullName: 'Address Owner',
        phone: '+919876543210',
        line1: 'Market Road 2',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411002',
        countryCode: 'IN',
      },
      buyer.accessToken,
    );
    expect(secondAddress.status).toBe(201);
    const secondAddressData = unwrapSuccess<Address>(secondAddress);

    const defaultAddress = await post<Address>(
      `/users/me/addresses/${secondAddressData.id}/default`,
      {},
      buyer.accessToken,
    );
    expect(defaultAddress.status).toBe(201);
    expect(unwrapSuccess<Address>(defaultAddress).isDefault).toBe(true);

    const addresses = unwrapSuccess<Address[]>(await get<Address[]>('/users/me/addresses', buyer.accessToken));
    expect(addresses.find((address) => address.id === secondAddressData.id)?.isDefault).toBe(true);
    expect(addresses.find((address) => address.id === firstAddressData.id)?.isDefault).toBe(false);
  });

  it('covers seller application, review, and store creation flows', async () => {
    const admin = unwrapSuccess<AuthResponse>(await registerUser(adminEmail, 'Admin', 'Reviewer'));
    await assignRole(admin.user.id, 'admin');
    const adminLogin = unwrapSuccess<AuthResponse>(await post<AuthResponse>('/auth/login', { email: adminEmail, password }));

    const seller = unwrapSuccess<AuthResponse>(await registerUser(sellerEmail, 'Seller', 'Approved'));
    const sellerApplication = await applySeller(seller.accessToken, sellerEmail, '27ABCDE1234F1Z5', 'ABCDE1234F');
    expect(sellerApplication.status).toBe(201);
    const sellerData = unwrapSuccess<Seller>(sellerApplication);
    expect(sellerData.status).toBe(SellerStatus.PENDING);

    const duplicateSeller = await applySeller(seller.accessToken, sellerEmail, '27ABCDE1234F1Z5', 'ABCDE1234F');
    expect(duplicateSeller.status).toBe(409);

    const unapprovedSeller = unwrapSuccess<AuthResponse>(
      await registerUser(unapprovedSellerEmail, 'Seller', 'Pending'),
    );
    const unapprovedApplication = unwrapSuccess<Seller>(
      await applySeller(unapprovedSeller.accessToken, unapprovedSellerEmail, '27ABCDE1234G1Z5', 'ABCDE1234G'),
    );

    const blockedStore = await createStore(unapprovedSeller.accessToken, `blocked-store-${suffix}`);
    expect(blockedStore.status).toBe(403);

    const approved = await post<Seller>(`/admin/sellers/${sellerData.id}/approve`, {}, adminLogin.accessToken);
    expect(approved.status).toBe(201);
    expect(unwrapSuccess<Seller>(approved).status).toBe(SellerStatus.APPROVED);

    const approvedSellerLogin = unwrapSuccess<AuthResponse>(
      await post<AuthResponse>('/auth/login', { email: sellerEmail, password }),
    );
    expect(approvedSellerLogin.user.roles).toContain('seller');

    const store = await createStore(approvedSellerLogin.accessToken, `approved-store-${suffix}`);
    expect(store.status).toBe(201);
    expect(unwrapSuccess<Store>(store).slug).toBe(`approved-store-${suffix}`);

    const rejectedSeller = unwrapSuccess<AuthResponse>(
      await registerUser(rejectedSellerEmail, 'Seller', 'Rejected'),
    );
    const rejectedApplication = unwrapSuccess<Seller>(
      await applySeller(rejectedSeller.accessToken, rejectedSellerEmail, '27ABCDE1234H1Z5', 'ABCDE1234H'),
    );
    const rejected = await post<Seller>(
      `/admin/sellers/${rejectedApplication.id}/reject`,
      {},
      adminLogin.accessToken,
    );
    expect(rejected.status).toBe(201);
    expect(unwrapSuccess<Seller>(rejected).status).toBe(SellerStatus.REJECTED);

    const suspendedSeller = unwrapSuccess<AuthResponse>(
      await registerUser(suspendedSellerEmail, 'Seller', 'Suspended'),
    );
    const suspendedApplication = unwrapSuccess<Seller>(
      await applySeller(suspendedSeller.accessToken, suspendedSellerEmail, '27ABCDE1234I1Z5', 'ABCDE1234I'),
    );
    const suspended = await post<Seller>(
      `/admin/sellers/${suspendedApplication.id}/suspend`,
      {},
      adminLogin.accessToken,
    );
    expect(suspended.status).toBe(201);
    expect(unwrapSuccess<Seller>(suspended).status).toBe(SellerStatus.SUSPENDED);

    const applications = await get<Seller[]>('/admin/sellers/applications', adminLogin.accessToken);
    expect(applications.status).toBe(200);
    expect(unwrapSuccess<Seller[]>(applications).some((application) => application.id === unapprovedApplication.id)).toBe(
      true,
    );
  });

  async function registerUser(email: string, firstName: string, lastName: string): Promise<HttpResult<AuthResponse>> {
    return post<AuthResponse>('/auth/register', {
      email,
      firstName,
      lastName,
      password,
    });
  }

  async function applySeller(
    accessToken: string,
    email: string,
    gstNumber: string,
    panNumber: string,
  ): Promise<HttpResult<Seller>> {
    return post<Seller>(
      '/sellers/applications',
      {
        businessName: `Integration Seller ${suffix}`,
        legalName: `Integration Seller ${suffix} Private Limited`,
        gstNumber,
        panNumber,
        email,
        phone: uniquePhoneFromPan(panNumber),
      },
      accessToken,
    );
  }

  async function createStore(accessToken: string, slug: string): Promise<HttpResult<Store>> {
    return post<Store>(
      '/sellers/me/stores',
      {
        name: `Store ${slug}`,
        slug,
        city: 'Pune',
        state: 'Maharashtra',
        address: 'Integration Market Road',
        postalCode: '411001',
      },
      accessToken,
    );
  }

  async function assignRole(userId: string, roleName: string): Promise<void> {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: 'Integration test role' },
      create: { name: roleName, description: 'Integration test role' },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });
  }

  async function get<T>(path: string, accessToken?: string): Promise<HttpResult<T>> {
    return request<T>('GET', path, undefined, accessToken);
  }

  async function post<T>(path: string, payload: unknown, accessToken?: string): Promise<HttpResult<T>> {
    return request<T>('POST', path, payload, accessToken);
  }

  async function patch<T>(path: string, payload: unknown, accessToken?: string): Promise<HttpResult<T>> {
    return request<T>('PATCH', path, payload, accessToken);
  }

  async function request<T>(
    method: 'GET' | 'PATCH' | 'POST',
    path: string,
    payload?: unknown,
    accessToken?: string,
  ): Promise<HttpResult<T>> {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (payload !== undefined) headers['content-type'] = 'application/json';
    if (accessToken) headers.authorization = `Bearer ${accessToken}`;

    const requestInit: RequestInit = {
      method,
      headers,
    };
    if (payload !== undefined) requestInit.body = JSON.stringify(payload);

    const response = await fetch(`${baseUrl}/api/v1${path}`, requestInit);

    return {
      status: response.status,
      body: (await response.json()) as ApiSuccess<T> | ApiFailure,
    };
  }
});

function unwrapSuccess<T>(result: HttpResult<T>): T {
  if (!result.body.success) {
    throw new Error(`Expected success response but got ${String(result.status)}: ${result.body.error.message}`);
  }
  return result.body.data;
}

function uniquePhoneFromPan(panNumber: string): string {
  const digit = panNumber.charCodeAt(panNumber.length - 1) % 10;
  return `+9198765432${String(digit)}`;
}

async function cleanupIntegrationData(prisma: PrismaService, suffix: string): Promise<void> {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: '@integration.nova.test', contains: suffix } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  if (userIds.length === 0) return;

  const sellers = await prisma.seller.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const sellerIds = sellers.map((seller) => seller.id);

  await prisma.store.deleteMany({ where: { sellerId: { in: sellerIds } } });
  await prisma.seller.deleteMany({ where: { id: { in: sellerIds } } });
  await prisma.address.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
