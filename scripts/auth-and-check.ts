import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const email = 'admin@maisonmiaro.com';
  const password = 'admin123';

  const before = await prisma.admin.findUnique({ where: { email } });
  console.log('before lastLoginAt:', before?.lastLoginAt);

  try {
    const res = await fetch('http://localhost:3002/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    console.log('HTTP status:', res.status);
    console.log('HTTP body:', await res.text());
  } catch (err) {
    console.error('fetch failed', err);
  }

  const after = await prisma.admin.findUnique({ where: { email } });
  console.log('after lastLoginAt:', after?.lastLoginAt);

  await prisma.$disconnect();
}

run().catch(console.error);
