/**
 * Script de test pour l'envoi d'email de contact
 * 
 * Usage:
 *   npx tsx scripts/test-contact-email.ts
 */

import { sendContactEmail } from '../src/lib/email';

async function testContactEmail() {
  console.log('\n📧 Test d\'envoi d\'email de contact...\n');

  const testData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    subject: 'Test Email - MaisonMiaro Contact Form',
    message: 'Ceci est un message de test envoyé depuis le script de test.\n\nSi vous recevez cet email, cela signifie que le système d\'envoi d\'email fonctionne correctement!\n\n✅ Configuration SMTP: OK\n✅ Fonction sendContactEmail: OK\n✅ Email de destination: jakob.legris17@gmail.com',
  };

  console.log('📝 Données de test:');
  console.log('  Nom:', testData.firstName, testData.lastName);
  console.log('  Email:', testData.email);
  console.log('  Sujet:', testData.subject);
  console.log('  Message:', testData.message.substring(0, 50) + '...\n');

  console.log('⏳ Envoi en cours...\n');

  const result = await sendContactEmail(testData);

  if (result.success) {
    console.log('✅ SUCCESS: Email envoyé avec succès!');
    console.log('   Vérifiez la boîte de réception: jakob.legris17@gmail.com\n');
    process.exit(0);
  } else {
    console.error('❌ ERROR: Échec de l\'envoi d\'email');
    console.error('   Erreur:', result.error);
    console.error('\n💡 Vérifiez:');
    console.error('   1. Les variables SMTP sont définies dans .env.local');
    console.error('   2. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD');
    console.error('   3. Si vous utilisez Gmail, créez un mot de passe d\'application\n');
    process.exit(1);
  }
}

// Exécuter le test
testContactEmail().catch((error) => {
  console.error('❌ Erreur inattendue:', error);
  process.exit(1);
});
