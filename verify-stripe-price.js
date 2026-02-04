/**
 * Script pour vérifier que le price_id existe dans Stripe
 */

require('dotenv').config();
const Stripe = require('stripe');

const PRICE_TO_CHECK = 'price_1SwrmnC73ocS8esoPWpYgiHD';

async function verifyStripePrice() {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      console.error('\n❌ STRIPE_SECRET_KEY non trouvée dans .env\n');
      return;
    }

    // Déterminer si c'est TEST ou LIVE
    const isLiveMode = secretKey.startsWith('sk_live_');
    const isTestMode = secretKey.startsWith('sk_test_');
    
    console.log('\n🔐 VÉRIFICATION STRIPE\n');
    console.log('='.repeat(70));
    console.log(`Mode: ${isLiveMode ? '🔴 LIVE' : isTestMode ? '🟡 TEST' : '❓ INCONNU'}`);
    console.log(`Secret Key: ${secretKey.substring(0, 20)}...${secretKey.substring(secretKey.length - 10)}`);
    console.log('='.repeat(70));

    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
    });

    console.log(`\n🔍 Recherche du prix: ${PRICE_TO_CHECK}\n`);

    try {
      const price = await stripe.prices.retrieve(PRICE_TO_CHECK);
      
      console.log('✅ PRIX TROUVÉ!\n');
      console.log('📋 Détails:');
      console.log(`   ID: ${price.id}`);
      console.log(`   Produit: ${price.product}`);
      console.log(`   Montant: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`);
      console.log(`   Type: ${price.type}`);
      console.log(`   Actif: ${price.active ? '✅' : '❌'}`);
      console.log(`   Mode: ${price.livemode ? '🔴 LIVE' : '🟡 TEST'}\n`);

      if (isLiveMode && !price.livemode) {
        console.log('⚠️  ATTENTION: Vous utilisez des clés LIVE mais le prix est en mode TEST!\n');
      } else if (isTestMode && price.livemode) {
        console.log('⚠️  ATTENTION: Vous utilisez des clés TEST mais le prix est en mode LIVE!\n');
      } else {
        console.log('✅ Le mode des clés API correspond au mode du prix.\n');
      }

    } catch (error) {
      if (error.code === 'resource_missing') {
        console.log('❌ PRIX NON TROUVÉ!\n');
        console.log('Ce prix n\'existe pas dans votre compte Stripe.\n');
        console.log('🔍 Vérifications possibles:\n');
        console.log('1️⃣  Allez sur: https://dashboard.stripe.com/prices');
        console.log('2️⃣  Cherchez le prix dans la liste');
        console.log('3️⃣  Vérifiez que vous êtes en mode LIVE (pas TEST)');
        console.log('4️⃣  Vérifiez le toggle "View test data" en haut à droite\n');
        
        console.log('💡 Pour lister tous vos prix:\n');
        const allPrices = await stripe.prices.list({ limit: 10 });
        
        if (allPrices.data.length === 0) {
          console.log('   ❌ Aucun prix trouvé dans ce compte Stripe!\n');
        } else {
          console.log('   📋 Vos prix disponibles:\n');
          allPrices.data.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.id}`);
            console.log(`      Produit: ${p.product}`);
            console.log(`      Montant: ${p.unit_amount / 100} ${p.currency.toUpperCase()}`);
            console.log(`      Mode: ${p.livemode ? 'LIVE' : 'TEST'}\n`);
          });
        }
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n⚠️  Problème d\'authentification Stripe.');
      console.log('   Vérifiez que STRIPE_SECRET_KEY dans .env est correct.\n');
    }
  }
}

verifyStripePrice();
