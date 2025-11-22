#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteDemoProducts() {
  console.log('🗑️  Deleting demo products...\n');

  try {
    // Delete all products (this will cascade delete images, variants, inventory, etc.)
    const deleteResult = await prisma.product.deleteMany();

    console.log(`✅ Deleted ${deleteResult.count} products`);

    // Delete categories
    const deleteCategoriesResult = await prisma.category.deleteMany();
    console.log(`✅ Deleted ${deleteCategoriesResult.count} categories`);

    // Delete options and option values
    const deleteOptionsResult = await prisma.option.deleteMany();
    console.log(`✅ Deleted ${deleteOptionsResult.count} options`);

    // Delete demo customer and related data if exists
    const demoUser = await prisma.user.findUnique({
      where: { email: 'user@maisonmiaro.com' },
    });

    if (demoUser) {
      await prisma.user.delete({
        where: { email: 'user@maisonmiaro.com' },
      });
      console.log('✅ Deleted demo customer');
    }

    console.log('\n✨ All demo data has been removed successfully!');
    console.log('💡 Your admin account remains intact.');
    console.log('📝 You can now add your own products through the admin panel.');
  } catch (error) {
    console.error('❌ Error deleting demo products:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteDemoProducts();
