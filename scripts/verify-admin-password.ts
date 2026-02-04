import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  try {
    const email = 'admin@maisonmiaro.com';
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      console.log('No admin found');
      return;
    }
    console.log('Admin found. passwordHash length:', admin.passwordHash?.length ?? 'none');
    const candidates = ['admin123', 'YourSecurePassword123!Change-This'];
    for (const pwd of candidates) {
      const ok = await bcrypt.compare(pwd, admin.passwordHash || '');
      console.log(`${pwd} -> ${ok}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
