import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePrices() {
  try {
    console.log('🔍 Recherche de produits avec un prix de 60...');
    
    // Find products with price = 60
    const productsWithPrice60 = await prisma.product.findMany({
      where: {
        price: 60
      },
      select: {
        id: true,
        name: true,
        price: true,
      }
    });

    console.log(`\n📦 ${productsWithPrice60.length} produit(s) trouvé(s) avec un prix de 60:`);
    productsWithPrice60.forEach(p => {
      console.log(`   - ${p.name} (ID: ${p.id}) - Prix actuel: €${p.price}`);
    });

    if (productsWithPrice60.length === 0) {
      console.log('\n✅ Aucun produit à mettre à jour.');
      return;
    }

    console.log('\n💰 Mise à jour du prix de 60 à 90...');
    
    // Update all products with price 60 to 90
    const result = await prisma.product.updateMany({
      where: {
        price: 60
      },
      data: {
        price: 90
      }
    });

    console.log(`\n✅ ${result.count} produit(s) mis à jour avec succès !`);
    
    // Verify the update
    const updatedProducts = await prisma.product.findMany({
      where: {
        price: 90
      },
      select: {
        id: true,
        name: true,
        price: true,
      }
    });

    console.log('\n✨ Produits avec nouveau prix de 90:');
    updatedProducts.forEach(p => {
      console.log(`   - ${p.name} (ID: ${p.id}) - Prix: €${p.price}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des prix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updatePrices()
  .then(() => {
    console.log('\n🎉 Mise à jour terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
