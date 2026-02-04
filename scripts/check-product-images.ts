import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductImages() {
  try {
    console.log('🔍 Checking products and their images...\n');
    
    const products = await prisma.product.findMany({
      include: {
        images: true,
      },
    });

    if (products.length === 0) {
      console.log('❌ No products found in database');
      return;
    }

    products.forEach((product, index) => {
      console.log(`${index + 1}. Product: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Slug: ${product.slug || 'N/A'}`);
      console.log(`   Active: ${product.isActive}`);
      console.log(`   Published: ${product.publishedAt ? 'Yes' : 'No'}`);
      console.log(`   Images (${product.images.length}):`);
      
      if (product.images.length === 0) {
        console.log('      ⚠️  No images - Add via admin panel');
      } else {
        product.images.forEach((img, imgIndex) => {
          console.log(`      ${imgIndex + 1}. ${img.url} (alt: ${img.altText || 'N/A'})`);
        });
      }
      console.log('');
    });

    console.log('\n💡 To add an image:');
    console.log('   1. Go to http://localhost:3000/admin/dashboard/products');
    console.log('   2. Click "Edit" on a product');
    console.log('   3. In "Image URL" field, type: /0000.jpg');
    console.log('   4. Click the + button');
    console.log('   5. Click "Update Product"');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductImages();
