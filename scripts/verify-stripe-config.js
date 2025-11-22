require('dotenv').config();

const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_APP_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  process.exit(1);
} else {
  console.log('✅ All required Stripe environment variables are set');
  
  // Verify Stripe secret key format
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey.startsWith('sk_')) {
    console.error('❌ STRIPE_SECRET_KEY appears to be invalid (should start with sk_)');
    process.exit(1);
  }
  
  // Verify publishable key format
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!pubKey.startsWith('pk_')) {
    console.error('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY appears to be invalid (should start with pk_)');
    process.exit(1);
  }
  
  // Verify webhook secret format
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret.startsWith('whsec_')) {
    console.error('❌ STRIPE_WEBHOOK_SECRET appears to be invalid (should start with whsec_)');
    process.exit(1);
  }
  
  // Verify app URL format
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  try {
    new URL(appUrl);
  } catch (e) {
    console.error('❌ NEXT_PUBLIC_APP_URL appears to be invalid (should be a valid URL)');
    process.exit(1);
  }
  
  console.log('✅ All Stripe configuration values appear to be valid');
}