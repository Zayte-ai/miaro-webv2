/**
 * Test rapide de l'API checkout
 */

async function quickTest() {
  console.log('\n🧪 TEST RAPIDE CHECKOUT API\n');
  
  try {
    const start = Date.now();
    const response = await fetch('http://localhost:3000/api/payments/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            productId: 'cmkt16xtg000awnj81l64bfex',
            quantity: 1
          }
        ],
      }),
    });

    const duration = Date.now() - start;
    const data = await response.json();
    
    console.log(`⏱️  Temps de réponse: ${duration}ms\n`);
    console.log(`📥 Status: ${response.status}\n`);
    
    if (response.ok) {
      console.log('✅ SUCCESS!\n');
      console.log('Client Secret:', data.clientSecret ? 'Reçu' : 'Manquant');
      console.log('Session ID:', data.sessionId || 'Manquant');
    } else {
      console.log('❌ ERREUR:\n');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  }
}

quickTest();
