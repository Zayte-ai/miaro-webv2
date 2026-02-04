/**
 * Script pour configurer les prix Stripe
 * 
 * ÉTAPES:
 * 1. Exécutez ce script pour voir vos produits: node setup-stripe-prices.js
 * 2. Pour chaque produit, créez un prix dans Stripe Dashboard
 * 3. Mettez à jour PRICE_MAP avec les vrais price_id
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupStripePrices() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        slug: true,
        description: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n🎯 VOS PRODUITS À CONFIGURER DANS STRIPE\n');
    console.log('='.repeat(70));
    
    if (products.length === 0) {
      console.log('❌ Aucun produit trouvé dans la base de données.');
      console.log('   Créez d\'abord des produits via le admin panel.\n');
      return;
    }

    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log('   ' + '-'.repeat(65));
      console.log(`   📋 Product ID: ${product.id}`);
      console.log(`   💰 Prix actuel: $${product.price} CAD`);
      console.log(`   🔗 Slug: ${product.slug}`);
      if (product.description) {
        const shortDesc = product.description.substring(0, 50);
        console.log(`   📝 Description: ${shortDesc}${product.description.length > 50 ? '...' : ''}`);
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n📝 PROCHAINES ÉTAPES:\n');
    console.log('1️⃣  Ouvrez Stripe Dashboard LIVE:');
    console.log('   https://dashboard.stripe.com/products\n');
    
    console.log('2️⃣  Pour CHAQUE produit ci-dessus:');
    console.log('   a) Cliquez sur "+ Add product"');
    console.log('   b) Nom: Copiez le nom exact du produit');
    console.log('   c) Description: (optionnel)');
    console.log('   d) Prix: Entrez le prix en CAD');
    console.log('   e) Cochez "One time" (paiement unique)');
    console.log('   f) Cliquez "Save product"\n');
    
    console.log('3️⃣  Après création, Stripe vous donnera un price_id');
    console.log('   Format: price_1xxxxxxxxxxxxx\n');
    
    console.log('4️⃣  Copiez ce price_id et ajoutez-le au PRICE_MAP:');
    console.log('   Fichier: src/app/api/payments/stripe/create-checkout-session/route.ts\n');
    
    console.log('📋 EXEMPLE DE PRICE_MAP À JOUR:\n');
    console.log('const PRICE_MAP: Record<string, string> = {');
    
    products.forEach((product, index) => {
      const comment = index === 0 ? ' // <- Remplacez par votre vrai price_id' : '';
      console.log(`  '${product.id}': 'price_VOTRE_PRICE_ID_ICI',${comment}`);
    });
    
    console.log('};\n');

    console.log('⚠️  IMPORTANT:');
    console.log('   - Utilisez les price_id de votre compte Stripe LIVE');
    console.log('   - Chaque produit doit avoir son propre prix dans Stripe');
    console.log('   - Vérifiez que les clés API dans .env correspondent au bon compte\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupStripePrices();
