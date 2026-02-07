/**
 * Validation des variables d'environnement au démarrage
 * Empêche l'application de démarrer si des variables critiques manquent
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
] as const;

const optionalEnvVars = [
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_BASE_URL',
] as const;

export function validateEnvironmentVariables() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Vérifier les variables requises
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Vérifier les variables optionnelles mais recommandées
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  // Erreur si des variables critiques manquent
  if (missing.length > 0) {
    console.error('\n❌ ERREUR: Variables d\'environnement manquantes (CRITIQUES):');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nL\'application ne peut pas démarrer sans ces variables.\n');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Avertissement si des variables recommandées manquent
  if (warnings.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('\n⚠️  AVERTISSEMENT: Variables d\'environnement manquantes (RECOMMANDÉES):');
    warnings.forEach(v => console.warn(`   - ${v}`));
    console.warn('');
  }

  // Vérifier que JWT_SECRET est suffisamment long
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('\n⚠️  AVERTISSEMENT: JWT_SECRET devrait faire au moins 32 caractères pour plus de sécurité\n');
  }

  // Vérifier que les clés Stripe sont bien en mode LIVE en production
  if (process.env.NODE_ENV === 'production') {
    const stripePubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const stripeSecKey = process.env.STRIPE_SECRET_KEY;

    if (stripePubKey && !stripePubKey.startsWith('pk_live_')) {
      console.warn('\n⚠️  AVERTISSEMENT: Vous utilisez une clé Stripe TEST en PRODUCTION!\n');
    }

    if (stripeSecKey && !stripeSecKey.startsWith('sk_live_')) {
      console.error('\n❌ ERREUR: Vous utilisez une clé secrète Stripe TEST en PRODUCTION!\n');
      throw new Error('Invalid Stripe secret key for production');
    }
  }

  console.log('✅ Variables d\'environnement validées avec succès');
}

// Validation automatique au chargement du module
if (typeof window === 'undefined') {
  // Seulement côté serveur
  try {
    validateEnvironmentVariables();
  } catch (error) {
    console.error(error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
