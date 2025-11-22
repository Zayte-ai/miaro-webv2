// API Configuration for E-commerce Integrations
// This file contains all the API endpoints and configurations needed for a real e-commerce website

// Environment variables - these should be in your .env.local file
export const API_CONFIG = {
  // Base URLs
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  API_VERSION: 'v1',

  // Payment Providers
  STRIPE: {
    PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    ENDPOINTS: {
      CREATE_PAYMENT_INTENT: '/api/payments/stripe/create-intent',
      CONFIRM_PAYMENT: '/api/payments/stripe/confirm',
      WEBHOOKS: '/api/payments/stripe/webhooks',
      REFUND: '/api/payments/stripe/refund',
    },
  },

  PAYPAL: {
    CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    SANDBOX: process.env.NODE_ENV !== 'production',
    ENDPOINTS: {
      CREATE_ORDER: '/api/payments/paypal/create-order',
      CAPTURE_ORDER: '/api/payments/paypal/capture-order',
      WEBHOOKS: '/api/payments/paypal/webhooks',
    },
  },

  // E-commerce Platform Integrations
  SHOPIFY: {
    SHOP_DOMAIN: process.env.SHOPIFY_SHOP_DOMAIN,
    ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,
    WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET,
    API_VERSION: '2024-01',
    ENDPOINTS: {
      PRODUCTS: '/api/integrations/shopify/products',
      ORDERS: '/api/integrations/shopify/orders',
      CUSTOMERS: '/api/integrations/shopify/customers',
      INVENTORY: '/api/integrations/shopify/inventory',
      WEBHOOKS: '/api/integrations/shopify/webhooks',
    },
  },

  WOOCOMMERCE: {
    STORE_URL: process.env.WOOCOMMERCE_STORE_URL,
    CONSUMER_KEY: process.env.WOOCOMMERCE_CONSUMER_KEY,
    CONSUMER_SECRET: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    ENDPOINTS: {
      PRODUCTS: '/api/integrations/woocommerce/products',
      ORDERS: '/api/integrations/woocommerce/orders',
      CUSTOMERS: '/api/integrations/woocommerce/customers',
    },
  },

  // Shipping Providers
  SHIPPING: {
    SHIPPO: {
      API_KEY: process.env.SHIPPO_API_KEY,
      ENDPOINTS: {
        RATES: '/api/shipping/shippo/rates',
        LABELS: '/api/shipping/shippo/labels',
        TRACKING: '/api/shipping/shippo/tracking',
      },
    },
    FEDEX: {
      API_KEY: process.env.FEDEX_API_KEY,
      SECRET_KEY: process.env.FEDEX_SECRET_KEY,
      ENDPOINTS: {
        RATES: '/api/shipping/fedex/rates',
        LABELS: '/api/shipping/fedex/labels',
        TRACKING: '/api/shipping/fedex/tracking',
      },
    },
  },

  // Inventory Management
  INVENTORY: {
    ENDPOINTS: {
      STOCK: '/api/inventory/stock',
      RESERVATIONS: '/api/inventory/reservations',
      LOW_STOCK_ALERTS: '/api/inventory/alerts',
      REORDER_POINTS: '/api/inventory/reorder',
    },
  },

  // Order Management
  ORDERS: {
    ENDPOINTS: {
      CREATE: '/api/orders',
      UPDATE: '/api/orders/:id',
      GET: '/api/orders/:id',
      LIST: '/api/orders',
      CANCEL: '/api/orders/:id/cancel',
      FULFILL: '/api/orders/:id/fulfill',
      TRACKING: '/api/orders/:id/tracking',
    },
  },

  // Product Management
  PRODUCTS: {
    ENDPOINTS: {
      CREATE: '/api/products',
      UPDATE: '/api/products/:id',
      DELETE: '/api/products/:id',
      GET: '/api/products/:id',
      LIST: '/api/products',
      VARIANTS: '/api/products/:id/variants',
      IMAGES: '/api/products/:id/images',
      SYNC: '/api/products/sync',
    },
  },

  // Customer Management
  CUSTOMERS: {
    ENDPOINTS: {
      CREATE: '/api/customers',
      UPDATE: '/api/customers/:id',
      GET: '/api/customers/:id',
      LIST: '/api/customers',
      ORDERS: '/api/customers/:id/orders',
    },
  },

  // Analytics
  ANALYTICS: {
    ENDPOINTS: {
      METRICS: '/api/admin/analytics/metrics',
      SALES: '/api/admin/analytics/sales',
      TOP_PRODUCTS: '/api/admin/analytics/top-products',
      CATEGORIES: '/api/admin/analytics/categories',
      EXPORT: '/api/admin/analytics/export',
      REAL_TIME: '/api/admin/analytics/real-time',
    },
  },

  // Email Services
  EMAIL: {
    SENDGRID: {
      API_KEY: process.env.SENDGRID_API_KEY,
      FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
    },
    MAILGUN: {
      API_KEY: process.env.MAILGUN_API_KEY,
      DOMAIN: process.env.MAILGUN_DOMAIN,
    },
    ENDPOINTS: {
      ORDER_CONFIRMATION: '/api/email/order-confirmation',
      SHIPPING_NOTIFICATION: '/api/email/shipping-notification',
      WELCOME: '/api/email/welcome',
      ABANDONED_CART: '/api/email/abandoned-cart',
    },
  },

  // File Storage
  STORAGE: {
    CLOUDINARY: {
      CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      API_KEY: process.env.CLOUDINARY_API_KEY,
      API_SECRET: process.env.CLOUDINARY_API_SECRET,
    },
    AWS_S3: {
      BUCKET: process.env.AWS_S3_BUCKET,
      REGION: process.env.AWS_S3_REGION,
      ACCESS_KEY: process.env.AWS_ACCESS_KEY_ID,
      SECRET_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    },
    ENDPOINTS: {
      UPLOAD: '/api/upload',
      DELETE: '/api/upload/delete',
    },
  },

  // Search & Recommendations
  SEARCH: {
    ALGOLIA: {
      APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
      SEARCH_KEY: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,
      ADMIN_KEY: process.env.ALGOLIA_ADMIN_KEY,
    },
    ENDPOINTS: {
      SEARCH: '/api/search',
      SUGGESTIONS: '/api/search/suggestions',
      RECOMMENDATIONS: '/api/search/recommendations',
    },
  },

  // Authentication
  AUTH: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE: {
      CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    },
    FACEBOOK: {
      CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
      CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
    },
  },

  // Database
  DATABASE: {
    POSTGRES_URL: process.env.DATABASE_URL,
    MONGODB_URI: process.env.MONGODB_URI,
    REDIS_URL: process.env.REDIS_URL,
  },

  // Third-party Services
  SERVICES: {
    // Tax calculation
    TAXJAR: {
      API_KEY: process.env.TAXJAR_API_KEY,
      ENDPOINTS: {
        CALCULATE: '/api/tax/calculate',
        VALIDATE: '/api/tax/validate',
      },
    },
    
    // Reviews
    TRUSTPILOT: {
      API_KEY: process.env.TRUSTPILOT_API_KEY,
      BUSINESS_UNIT: process.env.TRUSTPILOT_BUSINESS_UNIT,
    },
    
    // Chat Support
    INTERCOM: {
      APP_ID: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
      ACCESS_TOKEN: process.env.INTERCOM_ACCESS_TOKEN,
    },
    
    // SMS Notifications
    TWILIO: {
      ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    },
  },
};

// Helper functions for API endpoints
export const getApiUrl = (path: string) => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}${path}`;
};

export const getShopifyUrl = (endpoint: string) => {
  const { SHOP_DOMAIN, API_VERSION } = API_CONFIG.SHOPIFY;
  return `https://${SHOP_DOMAIN}.myshopify.com/admin/api/${API_VERSION}${endpoint}`;
};

export const getStripeHeaders = () => ({
  'Authorization': `Bearer ${API_CONFIG.STRIPE.SECRET_KEY}`,
  'Content-Type': 'application/json',
});

export const getShopifyHeaders = () => ({
  'X-Shopify-Access-Token': API_CONFIG.SHOPIFY.ACCESS_TOKEN,
  'Content-Type': 'application/json',
});

// Webhook signature verification
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string,
  provider: 'stripe' | 'shopify' | 'paypal'
) => {
  // Implementation would depend on the provider
  // This is a placeholder for the actual verification logic
  switch (provider) {
    case 'stripe':
      // Stripe signature verification
      break;
    case 'shopify':
      // Shopify signature verification
      break;
    case 'paypal':
      // PayPal signature verification
      break;
  }
};
