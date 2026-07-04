import { AddressType, CartStatus, OrderStatus, PaymentProvider, PaymentStatus, PrismaClient, ProductStatus, SellerStatus, UserStatus } from '@prisma/client';
import { hashPassword } from '../src/auth/utils/password.util';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const permissions = [
    { action: 'manage', subject: 'all', description: 'Full platform administration' },
    { action: 'read', subject: 'catalog', description: 'Read catalog resources' },
    { action: 'manage', subject: 'orders', description: 'Manage order operations' },
    { action: 'manage', subject: 'own_profile', description: 'Manage own customer profile' },
    { action: 'manage', subject: 'own_seller_profile', description: 'Manage own seller profile and stores' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { action_subject: { action: permission.action, subject: permission.subject } },
      update: { description: permission.description },
      create: permission,
    });
  }

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: { description: 'Platform administrator' },
    create: { name: 'admin', description: 'Platform administrator' },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'customer' },
    update: { description: 'Marketplace customer' },
    create: { name: 'customer', description: 'Marketplace customer' },
  });

  const sellerRole = await prisma.role.upsert({
    where: { name: 'seller' },
    update: { description: 'Approved marketplace seller' },
    create: { name: 'seller', description: 'Approved marketplace seller' },
  });

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id },
    });
  }

  const profilePermission = await prisma.permission.findUniqueOrThrow({
    where: { action_subject: { action: 'manage', subject: 'own_profile' } },
  });

  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: customerRole.id, permissionId: profilePermission.id } },
    update: {},
    create: { roleId: customerRole.id, permissionId: profilePermission.id },
  });

  const sellerProfilePermission = await prisma.permission.findUniqueOrThrow({
    where: { action_subject: { action: 'manage', subject: 'own_seller_profile' } },
  });

  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: sellerRole.id, permissionId: sellerProfilePermission.id } },
    update: {},
    create: { roleId: sellerRole.id, permissionId: sellerProfilePermission.id },
  });

  const passwordHash = await hashPassword('Password123!');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cadde.local' },
    update: { status: UserStatus.ACTIVE },
    create: {
      email: 'admin@cadde.local',
      firstName: 'Cadde',
      lastName: 'Admin',
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@cadde.local' },
    update: { status: UserStatus.ACTIVE },
    create: {
      email: 'customer@cadde.local',
      firstName: 'Cadde',
      lastName: 'Customer',
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@cadde.local' },
    update: { status: UserStatus.ACTIVE },
    create: {
      email: 'seller@cadde.local',
      firstName: 'Cadde',
      lastName: 'Seller',
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  for (const [userId, roleId] of [
    [adminUser.id, adminRole.id],
    [customerUser.id, customerRole.id],
    [sellerUser.id, sellerRole.id],
  ]) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: { status: SellerStatus.APPROVED },
    create: {
      userId: sellerUser.id,
      businessName: 'Cadde Demo Seller',
      legalName: 'Cadde Demo Seller Pvt Ltd',
      gstNumber: '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      email: 'seller-business@cadde.local',
      phone: '+919999999001',
      status: SellerStatus.APPROVED,
    },
  });

  const store = await prisma.store.upsert({
    where: { slug: 'cadde-demo-store' },
    update: { isVerified: true, sellerId: seller.id },
    create: {
      sellerId: seller.id,
      name: 'Cadde Demo Store',
      slug: 'cadde-demo-store',
      description: 'Approved local seller store for MVP testing.',
      city: 'Bengaluru',
      state: 'Karnataka',
      address: 'MG Road',
      postalCode: '560001',
      isVerified: true,
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: 'apparel' },
    update: { isActive: true },
    create: { name: 'Apparel', slug: 'apparel', description: 'Cadde Store apparel', isActive: true },
  });

  const brand = await prisma.brand.upsert({
    where: { slug: 'cadde-basics' },
    update: { isActive: true },
    create: { name: 'Cadde Basics', slug: 'cadde-basics', description: 'Everyday Cadde basics', isActive: true },
  });

  const product = await prisma.product.upsert({
    where: { slug: 'cadde-cotton-kurta' },
    update: { status: ProductStatus.ACTIVE },
    create: {
      storeId: store.id,
      categoryId: category.id,
      brandId: brand.id,
      name: 'Cadde Cotton Kurta',
      slug: 'cadde-cotton-kurta',
      description: 'Soft cotton kurta for Cadde Store MVP testing.',
      status: ProductStatus.ACTIVE,
      images: {
        create: [{ url: 'https://example.com/cadde-cotton-kurta.jpg', altText: 'Cadde Cotton Kurta', isPrimary: true }],
      },
    },
  });

  const variant = await prisma.variant.upsert({
    where: { sku: 'CADDE-KURTA-M' },
    update: { priceCents: 129900, isActive: true },
    create: {
      productId: product.id,
      sku: 'CADDE-KURTA-M',
      name: 'Medium',
      attributes: { size: 'M', color: 'Indigo' },
      priceCents: 129900,
      compareAtCents: 159900,
      currency: 'INR',
      isActive: true,
    },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'CADDE-BLR-01' },
    update: { isActive: true },
    create: {
      name: 'Cadde Bengaluru Warehouse',
      code: 'CADDE-BLR-01',
      address: 'Warehouse Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560002',
      isActive: true,
    },
  });

  await prisma.inventory.upsert({
    where: { storeId_variantId_warehouseId: { storeId: store.id, variantId: variant.id, warehouseId: warehouse.id } },
    update: { onHand: 25, reserved: 0, safetyStock: 2 },
    create: { storeId: store.id, variantId: variant.id, warehouseId: warehouse.id, onHand: 25, reserved: 0, safetyStock: 2 },
  });

  const address = await prisma.address.upsert({
    where: { id: 'seed_customer_address' },
    update: {},
    create: {
      id: 'seed_customer_address',
      userId: customerUser.id,
      type: AddressType.BOTH,
      fullName: 'Cadde Customer',
      phone: '+919999999002',
      line1: 'MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      isDefault: true,
    },
  });

  const cart = await prisma.cart.upsert({
    where: { id: 'seed_checked_out_cart' },
    update: { status: CartStatus.CHECKED_OUT },
    create: { id: 'seed_checked_out_cart', userId: customerUser.id, status: CartStatus.CHECKED_OUT },
  });

  const order = await prisma.order.upsert({
    where: { orderNumber: 'CADDE-SEED-ORDER-1' },
    update: { status: OrderStatus.CONFIRMED },
    create: {
      orderNumber: 'CADDE-SEED-ORDER-1',
      userId: customerUser.id,
      cartId: cart.id,
      billingAddressId: address.id,
      shippingAddressId: address.id,
      status: OrderStatus.CONFIRMED,
      subtotalCents: 129900,
      totalCents: 129900,
      currency: 'INR',
      items: {
        create: [{
          sellerId: seller.id,
          storeId: store.id,
          productId: product.id,
          variantId: variant.id,
          skuSnapshot: variant.sku,
          nameSnapshot: `${product.name} - ${variant.name}`,
          storeNameSnapshot: store.name,
          sellerNameSnapshot: seller.businessName,
          quantity: 1,
          unitPriceCents: variant.priceCents,
          totalCents: variant.priceCents,
          commissionRateSnapshot: seller.commissionRate,
          commissionAmountCents: Math.round((variant.priceCents * Number(seller.commissionRate)) / 100),
        }],
      },
    },
  });

  await prisma.payment.upsert({
    where: { id: 'seed_payment_success' },
    update: { status: PaymentStatus.CAPTURED },
    create: {
      id: 'seed_payment_success',
      orderId: order.id,
      provider: PaymentProvider.MANUAL_PENDING,
      status: PaymentStatus.CAPTURED,
      amountCents: order.totalCents,
      currency: order.currency,
      providerRef: 'seed_manual_capture',
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
