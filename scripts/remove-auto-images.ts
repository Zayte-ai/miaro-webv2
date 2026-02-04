import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeAutoImages() {
  try {
    console.log('🗑️  Removing automatically added images...');
    
    // Supprimer toutes les images /0000.jpg ajoutées automatiquement
    const result = await prisma.productImage.deleteMany({
      where: {
        url: '/0000.jpg',
      },
    });

    console.log(`✅ Removed ${result.count} image(s)`);
    console.log('\n📋 You can now add images manually via the admin panel:');
    console.log('   1. Go to /admin/dashboard/products');
    console.log('   2. Edit a product');
    console.log('   3. In "Image URL" field, enter: /0000.jpg');
    console.log('   4. Click the + button');
    console.log('   5. Save the product');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeAutoImages();
