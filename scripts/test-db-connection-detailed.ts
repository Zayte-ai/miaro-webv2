import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connected:', result);
    
    // Test products count
    const count = await prisma.product.count();
    console.log(`📦 Total products in database: ${count}`);
    
    // Test fetching one product
    const product = await prisma.product.findFirst({
      include: {
        images: true,
        category: true,
      },
    });
    
    if (product) {
      console.log('\n✅ Sample product:');
      console.log(`   Name: ${product.name}`);
      console.log(`   Images: ${product.images?.length || 0}`);
      console.log(`   Category: ${product.category?.name || 'None'}`);
    } else {
      console.log('⚠️  No products found');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
