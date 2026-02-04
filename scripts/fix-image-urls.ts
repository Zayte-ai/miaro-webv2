import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixImageUrls() {
  try {
    console.log('🔧 Fixing image URLs...\n');
    
    // Trouver toutes les images avec des chemins Windows
    const wrongImages = await prisma.productImage.findMany({
      where: {
        url: {
          contains: 'C:\\Users\\',
        },
      },
      include: {
        product: {
          select: {
            name: true,
          },
        },
      },
    });

    if (wrongImages.length === 0) {
      console.log('✅ No wrong image URLs found');
      return;
    }

    console.log(`Found ${wrongImages.length} image(s) with wrong URLs:\n`);

    for (const img of wrongImages) {
      console.log(`📸 Product: ${img.product.name}`);
      console.log(`   Old URL: ${img.url}`);
      
      // Corriger l'URL
      await prisma.productImage.update({
        where: {
          id: img.id,
        },
        data: {
          url: '/0000.jpg',
        },
      });
      
      console.log(`   New URL: /0000.jpg`);
      console.log(`   ✅ Fixed!\n`);
    }

    console.log('✨ All image URLs fixed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixImageUrls();
