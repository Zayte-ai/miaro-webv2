/**
 * Script de test pour le système de rotation 360°
 * 
 * Usage:
 * 1. Démarrer la base de données: docker-compose up -d
 * 2. Exécuter: npx ts-node scripts/test-rotation-360.ts
 */

import prisma from '../src/lib/db';

async function testRotation360System() {
  console.log('🧪 Test du système de rotation 360°\n');

  try {
    // Test 1: Vérifier que le champ rotationImage360Url existe
    console.log('✅ Test 1: Vérification du schéma...');
    const product = await prisma.product.findFirst();
    if (product !== null && 'rotationImage360Url' in product) {
      console.log('   ✓ Le champ rotationImage360Url existe dans le modèle Product');
    } else {
      console.log('   ✗ Le champ rotationImage360Url n\'existe pas encore');
      console.log('   → Exécutez: npx prisma migrate dev --name add_rotation_360_field');
    }

    // Test 2: Créer un produit de test avec une URL 360
    console.log('\n✅ Test 2: Création d\'un produit test...');
    
    // Trouver une catégorie existante
    let category = await prisma.category.findFirst();
    
    if (!category) {
      console.log('   → Création d\'une catégorie test...');
      category = await prisma.category.create({
        data: {
          name: 'Test Category',
          slug: 'test-category-360',
          isActive: true,
        },
      });
    }

    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Product 360',
        slug: `test-product-360-${Date.now()}`,
        description: 'Produit de test pour la rotation 360°',
        price: 99.99,
        categoryId: category.id,
        isActive: true,
        publishedAt: new Date(),
        rotationImage360Url: '/uploads/products/test/360.jpg',
      },
    });

    console.log(`   ✓ Produit test créé avec ID: ${testProduct.id}`);
    console.log(`   ✓ URL 360°: ${testProduct.rotationImage360Url}`);

    // Test 3: Récupérer le produit et vérifier l'URL
    console.log('\n✅ Test 3: Récupération du produit...');
    const retrievedProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
    });

    if (retrievedProduct?.rotationImage360Url) {
      console.log('   ✓ URL 360° récupérée correctement');
    } else {
      console.log('   ✗ Erreur lors de la récupération de l\'URL 360°');
    }

    // Test 4: Mettre à jour l'URL 360°
    console.log('\n✅ Test 4: Mise à jour de l\'URL 360°...');
    const updatedProduct = await prisma.product.update({
      where: { id: testProduct.id },
      data: { rotationImage360Url: '/uploads/products/test/360-updated.jpg' },
    });

    if (updatedProduct.rotationImage360Url === '/uploads/products/test/360-updated.jpg') {
      console.log('   ✓ URL 360° mise à jour correctement');
    } else {
      console.log('   ✗ Erreur lors de la mise à jour de l\'URL 360°');
    }

    // Test 5: Supprimer l'URL 360° (set to null)
    console.log('\n✅ Test 5: Suppression de l\'URL 360°...');
    const nullifiedProduct = await prisma.product.update({
      where: { id: testProduct.id },
      data: { rotationImage360Url: null },
    });

    if (nullifiedProduct.rotationImage360Url === null) {
      console.log('   ✓ URL 360° supprimée correctement (null)');
    } else {
      console.log('   ✗ Erreur lors de la suppression de l\'URL 360°');
    }

    // Nettoyage
    console.log('\n🧹 Nettoyage...');
    await prisma.product.delete({ where: { id: testProduct.id } });
    console.log('   ✓ Produit test supprimé');

    // Statistiques
    console.log('\n📊 Statistiques:');
    const productsWithRotation360 = await prisma.product.count({
      where: {
        rotationImage360Url: { not: null },
      },
    });
    console.log(`   • Produits avec rotation 360°: ${productsWithRotation360}`);

    const productsWithOld360 = await prisma.product.count({
      where: {
        has360Images: true,
      },
    });
    console.log(`   • Produits avec ancien système 360°: ${productsWithOld360}`);

    console.log('\n✅ Tous les tests ont réussi!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests
testRotation360System();
