import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const permissions = [
    { action: 'manage', subject: 'all', description: 'Full platform administration' },
    { action: 'read', subject: 'catalog', description: 'Read catalog resources' },
    { action: 'manage', subject: 'orders', description: 'Manage order operations' },
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

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
