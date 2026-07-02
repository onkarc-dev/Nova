import { PrismaClient } from '@prisma/client';

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
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
