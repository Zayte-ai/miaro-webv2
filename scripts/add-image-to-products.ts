import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addImageToProducts() {
  try {
    console.log('🔍 Fetching all products...');
    
    // Récupérer tous les produits
    const products = await prisma.product.findMany({
      include: {
        images: true,
      },
    });

    console.log(`📦 Found ${products.length} products`);

    if (products.length === 0) {
      console.log('❌ No products found. Please create a product first.');
      return;
    }

    // Ajouter l'image /0000.jpg à chaque produit qui n'a pas d'image
    for (const product of products) {
      const hasImage = product.images.some(img => img.url === '/0000.jpg');
      
      if (!hasImage) {
        console.log(`\n📸 Adding image to product: ${product.name}`);
        
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: '/0000.jpg',
            altText: product.name,
            sortOrder: product.images.length,
          },
        });
        
        console.log(`   ✅ Image added successfully`);
      } else {
        console.log(`\n⏭️  Product "${product.name}" already has this image, skipping`);
      }
    }

    console.log('\n✨ Done! All products updated.');
    
    // Afficher les résultats
    const updatedProducts = await prisma.product.findMany({
      include: {
        images: true,
      },
    });

    console.log('\n📋 Current products with images:');
    updatedProducts.forEach(p => {
      console.log(`\n   ${p.name}:`);
      p.images.forEach(img => {
        console.log(`      - ${img.url}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addImageToProducts();
