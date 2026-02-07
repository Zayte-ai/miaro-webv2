#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function resetAdminPassword() {
  console.log('🔐 Resetting admin password...\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@maisonmiaro.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  console.log(`Email: ${adminEmail}`);
  console.log(`New Password: ${adminPassword}\n`);

  try {
    // Hash the password
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    // Update or create admin
    const admin = await prisma.admin.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        email: adminEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'MaisonMiaro',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Admin password reset successfully!');
    console.log(`\n📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`✓ Status: ${admin.isActive ? 'Active' : 'Inactive'}`);
    console.log(`👤 Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`🛡️  Role: ${admin.role}\n`);
    
    console.log('You can now login at: http://localhost:3000/admin');
    
  } catch (error: any) {
    console.error('❌ Error resetting admin password:', error.message);
    
    if (error.message.includes("Can't reach database")) {
      console.error('\n⚠️  Database is not running!');
      console.error('Please start Docker Desktop and run: docker-compose up -d');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
