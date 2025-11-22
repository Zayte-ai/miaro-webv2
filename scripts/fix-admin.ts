#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function fixAdmin() {
  console.log('🔧 Checking and fixing admin account...\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@maisonmiaro.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`📧 Found admin: ${existingAdmin.email}`);
      console.log(`   Status: ${existingAdmin.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Last Login: ${existingAdmin.lastLoginAt || 'Never'}\n`);

      // Update admin to ensure it's active and has the correct password
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      const updatedAdmin = await prisma.admin.update({
        where: { email: adminEmail },
        data: {
          passwordHash,
          isActive: true,
        },
      });

      console.log('✅ Admin account updated successfully!');
      console.log(`   Email: ${updatedAdmin.email}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Status: ${updatedAdmin.isActive ? 'Active' : 'Inactive'}`);
    } else {
      console.log(`❌ No admin found with email: ${adminEmail}`);
      console.log('Creating new admin account...\n');

      const passwordHash = await bcrypt.hash(adminPassword, 12);

      const newAdmin = await prisma.admin.create({
        data: {
          email: adminEmail,
          passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });

      console.log('✅ Admin account created successfully!');
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Status: ${newAdmin.isActive ? 'Active' : 'Inactive'}`);
    }
  } catch (error) {
    console.error('❌ Error fixing admin account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();
