import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceFixImageUrl() {
  try {
    console.log('🔧 Force fixing image URL for product "image"...\n');
    
    // Trouver le produit "image"
    const product = await prisma.product.findFirst({
      where: {
        name: 'image',
      },
      include: {
        images: true,
      },
    });

    if (!product) {
      console.log('❌ Product "image" not found');
      return;
    }

    console.log(`📦 Found product: ${product.name}`);
    console.log(`   Current images: ${product.images.length}`);

    // Supprimer toutes les images existantes
    if (product.images.length > 0) {
      await prisma.productImage.deleteMany({
        where: {
          productId: product.id,
        },
      });
      console.log('   🗑️  Deleted old images');
    }

    // Ajouter la bonne image
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: '/0000.jpg',
        altText: product.name,
        sortOrder: 0,
      },
    });

    console.log('   ✅ Added correct image: /0000.jpg');
    console.log('\n✨ Done! The image should now display correctly.');
    console.log('   Refresh the /shop page to see the change.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceFixImageUrl();
