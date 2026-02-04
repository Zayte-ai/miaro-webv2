/**
 * Environment Variables Validation
 * Ensures all required environment variables are set before runtime
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
] as const;

const optionalEnvVars = {
  // Stripe
  STRIPE_SECRET_KEY: 'Stripe payment processing',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook verification',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'Stripe client-side integration',
  
  // Email
  SMTP_HOST: 'Email notifications',
  SMTP_PORT: 'Email server port',
  SMTP_USER: 'Email authentication',
  SMTP_PASSWORD: 'Email authentication',
  CONTACT_EMAIL: 'Contact form recipient',
  
  // FedEx Shipping
  FEDEX_API_KEY: 'FedEx shipping integration',
  FEDEX_SECRET_KEY: 'FedEx API authentication',
  FEDEX_ACCOUNT_NUMBER: 'FedEx account',
  FEDEX_METER_NUMBER: 'FedEx meter',
  
  // Warehouse
  WAREHOUSE_ADDRESS_LINE1: 'Shipping origin address',
  WAREHOUSE_CITY: 'Warehouse location',
  WAREHOUSE_STATE: 'Warehouse state',
  WAREHOUSE_ZIP: 'Warehouse postal code',
  WAREHOUSE_CONTACT_NAME: 'Warehouse contact',
  WAREHOUSE_PHONE: 'Warehouse phone number',
  
  // App Config
  NEXT_PUBLIC_APP_URL: 'Application URL',
  RATE_LIMIT_WINDOW_MS: 'Rate limiting window',
  RATE_LIMIT_MAX_REQUESTS: 'Rate limiting max requests',
} as const;

export function validateEnv() {
  const missing: string[] = [];
  const warnings: Array<{ key: string; purpose: string }> = [];
  
  // Check required variables
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  // Report missing required variables
  if (missing.length > 0) {
    const errorMessage = [
      '❌ FATAL: Missing required environment variables:',
      '',
      ...missing.map(key => `  - ${key}`),
      '',
      'These variables are REQUIRED for the application to function.',
      'Please check your .env file or deployment environment settings.',
      '',
      'See .env.example for reference.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }
  
  // Check optional variables and warn if missing
  for (const [key, purpose] of Object.entries(optionalEnvVars)) {
    if (!process.env[key]) {
      warnings.push({ key, purpose });
    }
  }
  
  // Log warnings in development
  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Optional environment variables not configured:');
    warnings.forEach(({ key, purpose }) => {
      console.warn(`  - ${key} (${purpose})`);
    });
    console.warn('Some features may not work without these variables.\n');
  }
  
  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 32) {
    throw new Error(
      '❌ FATAL: JWT_SECRET must be at least 32 characters long for security.\n' +
      'Generate a secure secret with: openssl rand -base64 32'
    );
  }
  
  // Validate email format for ADMIN_EMAIL
  const adminEmail = process.env.ADMIN_EMAIL!;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminEmail)) {
    throw new Error(`❌ FATAL: ADMIN_EMAIL "${adminEmail}" is not a valid email address.`);
  }
  
  // Success message
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Environment variables validated successfully');
  }
}

// Auto-validate in production
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}
