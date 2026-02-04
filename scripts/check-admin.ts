import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('🔍 Checking admins in database...\n');
    
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    console.log('=' .repeat(80));
    if (admins.length > 0) {
      console.log(`✅ Found ${admins.length} admin(s):`);
      console.log('=' .repeat(80));
      admins.forEach((admin, index) => {
        console.log(`\n[Admin ${index + 1}]`);
        console.log(`  Email: ${admin.email}`);
        console.log(`  Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`  Role: ${admin.role}`);
        console.log(`  Active: ${admin.isActive ? '✅' : '❌'}`);
        console.log(`  Created: ${admin.createdAt.toISOString()}`);
      });
    } else {
      console.log('❌ NO ADMINS FOUND!');
      console.log('=' .repeat(80));
      console.log('\n💡 To create an admin, run:');
      console.log('   npm run seed\n');
      console.log('📝 Or check your .env file has:');
      console.log('   ADMIN_EMAIL="admin@maisonmiaro.com"');
      console.log('   ADMIN_PASSWORD="YourSecurePassword123"');
    }
    console.log('\n' + '=' .repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
