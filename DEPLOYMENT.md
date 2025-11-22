# MaisonMiaro E-commerce - Production Deployment Guide

## Overview
This guide covers deploying your MaisonMiaro e-commerce website to production with all integrations, payment processing, user accounts, and real-world functionality.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Setup](#database-setup)
3. [User Authentication System](#user-authentication-system)
4. [Payment Integration](#payment-integration)
5. [Shipping & Fulfillment](#shipping--fulfillment)
6. [Email & Notifications](#email--notifications)
7. [Analytics & Monitoring](#analytics--monitoring)
8. [Security & Compliance](#security--compliance)
9. [Deployment Platforms](#deployment-platforms)
10. [Domain & SSL](#domain--ssl)
11. [Performance Optimization](#performance-optimization)
12. [Testing & Quality Assurance](#testing--quality-assurance)
13. [Go-Live Checklist](#go-live-checklist)

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Set up production environment variables
- [ ] Configure database connections
- [ ] Set up Redis for caching
- [ ] Configure file storage (Cloudinary/AWS S3)
- [ ] Set up email services
- [ ] Configure payment providers

### 2. Security Setup
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS policies
- [ ] Set up rate limiting
- [ ] Configure security headers
- [ ] Set up authentication (NextAuth.js)
- [ ] Configure admin access controls

### 3. Performance Optimization
- [ ] Enable CDN for static assets
- [ ] Configure image optimization
- [ ] Set up caching strategies
- [ ] Optimize database queries
- [ ] Configure compression

## Database Setup

### PostgreSQL (Recommended)
```bash
# Install PostgreSQL
# Create database
createdb maisonmiaro_production

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### Prisma Schema Example
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  salePrice   Decimal? @db.Decimal(10, 2)
  sku         String   @unique
  images      String[]
  model3d     String?
  category    Category @relation(fields: [categoryId], references: [id])
  categoryId  String
  variants    ProductVariant[]
  inventory   Inventory[]
  orderItems  OrderItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Category {
  id       String    @id @default(cuid())
  name     String    @unique
  slug     String    @unique
  products Product[]
}

model ProductVariant {
  id        String @id @default(cuid())
  product   Product @relation(fields: [productId], references: [id])
  productId String
  sku       String @unique
  size      String
  color     String
  price     Decimal @db.Decimal(10, 2)
  inventory Inventory[]
}

model Inventory {
  id        String         @id @default(cuid())
  product   Product        @relation(fields: [productId], references: [id])
  productId String
  variant   ProductVariant? @relation(fields: [variantId], references: [id])
  variantId String?
  quantity  Int
  reserved  Int            @default(0)
  location  String?
  updatedAt DateTime       @updatedAt
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String
  lastName  String
  phone     String?
  orders    Order[]
  addresses Address[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Order {
  id              String      @id @default(cuid())
  user            User        @relation(fields: [userId], references: [id])
  userId          String
  status          OrderStatus @default(PENDING)
  items           OrderItem[]
  shippingAddress Address     @relation(fields: [shippingAddressId], references: [id])
  shippingAddressId String
  billingAddress  Address     @relation(fields: [billingAddressId], references: [id])
  billingAddressId String
  subtotal        Decimal     @db.Decimal(10, 2)
  tax             Decimal     @db.Decimal(10, 2)
  shipping        Decimal     @db.Decimal(10, 2)
  total           Decimal     @db.Decimal(10, 2)
  paymentIntentId String?
  trackingNumber  String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model OrderItem {
  id        String  @id @default(cuid())
  order     Order   @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product @relation(fields: [productId], references: [id])
  productId String
  quantity  Int
  price     Decimal @db.Decimal(10, 2)
  size      String?
  color     String?
}

model Address {
  id           String  @id @default(cuid())
  user         User    @relation(fields: [userId], references: [id])
  userId       String
  firstName    String
  lastName     String
  company      String?
  address1     String
  address2     String?
  city         String
  state        String
  postalCode   String
  country      String
  phone        String?
  isDefault    Boolean @default(false)
  shippingOrders Order[] @relation("OrderShippingAddress")
  billingOrders  Order[] @relation("OrderBillingAddress")
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

## User Authentication System

The MaisonMiaro e-commerce platform includes a complete user authentication and account management system. Here's how to set it up for production:

### NextAuth.js Setup

For secure authentication, we use NextAuth.js, a complete authentication solution for Next.js applications.

```javascript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });
        
        if (!user || !user.password) {
          return null;
        }
        
        const isPasswordValid = await compare(credentials.password, user.password);
        
        if (!isPasswordValid) {
          return null;
        }
        
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    newUser: '/auth/register',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### Required Environment Variables

For production authentication, configure these environment variables:

```
# Authentication
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=a_long_random_string_for_jwt_encryption

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
```

### Password Reset Functionality

For the password reset functionality, you need to implement email sending. Use a service like SendGrid or Amazon SES:

```javascript
// lib/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendPasswordResetEmail(email, resetLink) {
  const msg = {
    to: email,
    from: 'noreply@maisonmiaro.com',
    subject: 'Reset Your MaisonMiaro Password',
    text: `Click this link to reset your password: ${resetLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #000;">MaisonMiaro</h1>
        <h2>Reset Your Password</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        <p>If you didn't request a password reset, you can ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `,
  };
  
  return sgMail.send(msg);
}
```

### Security Considerations

1. **Password Storage**: Never store passwords in plain text. Use bcrypt for password hashing:

```javascript
import { hash } from 'bcryptjs';

// When creating a new user
const hashedPassword = await hash(password, 12);
```

2. **JWT Timeouts**: Configure appropriate timeout for JWT tokens in production:

```javascript
// In NextAuth options
jwt: {
  secret: process.env.NEXTAUTH_SECRET,
  maxAge: 60 * 60 * 24 * 30, // 30 days
}
```

3. **HTTPS**: Ensure all authentication happens over HTTPS

4. **Rate Limiting**: Implement rate limiting on login and password reset attempts:

```javascript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  // Apply rate limiting for auth routes
  if (req.nextUrl.pathname.startsWith('/api/auth')) {
    // Rate limiting implementation
    // ...
  }
  
  return NextResponse.next();
}
```

## Payment Integration

### Stripe Setup
```javascript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Create payment intent
export async function createPaymentIntent(amount: number, currency = 'usd') {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
  });
}
```

### PayPal Setup
```javascript
// lib/paypal.ts
import { PayPalApi } from '@paypal/checkout-server-sdk';

const environment = process.env.NODE_ENV === 'production' 
  ? new PayPalApi.live(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!)
  : new PayPalApi.sandbox(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!);

export const paypalClient = new PayPalApi.core.PayPalHttpClient(environment);
```

## Shipping & Fulfillment

### Shippo Integration
```javascript
// lib/shipping.ts
import shippo from 'shippo';

shippo.setApiKey(process.env.SHIPPO_API_KEY!);

export async function calculateShippingRates(toAddress: Address, items: OrderItem[]) {
  const shipment = await shippo.shipment.create({
    address_from: {
      name: "MaisonMiaro",
      street1: "Your warehouse address",
      city: "Your city",
      state: "Your state",
      zip: "Your zip",
      country: "US",
    },
    address_to: toAddress,
    parcels: [{
      length: "10",
      width: "8",
      height: "4",
      distance_unit: "in",
      weight: calculateWeight(items),
      mass_unit: "lb",
    }],
  });

  return shipment.rates;
}
```

## Email & Notifications

### SendGrid Setup
```javascript
// lib/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendOrderConfirmation(order: Order) {
  const msg = {
    to: order.user.email,
    from: process.env.SENDGRID_FROM_EMAIL!,
    templateId: 'd-your-template-id',
    dynamicTemplateData: {
      orderNumber: order.id,
      items: order.items,
      total: order.total,
      shippingAddress: order.shippingAddress,
    },
  };

  await sgMail.send(msg);
}
```

## Analytics & Monitoring

### Google Analytics 4
```javascript
// lib/analytics.ts
import { GoogleAnalytics } from '@next/third-parties/google';

export function trackPurchase(order: Order) {
  gtag('event', 'purchase', {
    transaction_id: order.id,
    value: order.total,
    currency: 'USD',
    items: order.items.map(item => ({
      item_id: item.product.id,
      item_name: item.product.name,
      category: item.product.category.name,
      quantity: item.quantity,
      price: item.price,
    })),
  });
}
```

### Application Monitoring
```javascript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

export function logError(error: Error, context?: any) {
  Sentry.captureException(error, {
    extra: context,
  });
}
```

## Security & Compliance

### Rate Limiting
```javascript
// middleware.ts
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: Request) {
  const { success } = await ratelimit.limit(request.ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }
  
  return NextResponse.next();
}
```

### GDPR Compliance
```javascript
// components/CookieConsent.tsx
import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowConsent(false);
    // Initialize analytics
    gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p>We use cookies to improve your experience.</p>
        <button
          onClick={acceptCookies}
          className="bg-white text-black px-4 py-2 rounded"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
```

## Deployment Platforms

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### AWS/Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## Domain & SSL

### Custom Domain Setup
1. Purchase domain from registrar (Namecheap, GoDaddy, etc.)
2. Configure DNS records to point to your hosting provider
3. Set up SSL certificate (Let's Encrypt, Cloudflare)
4. Configure redirects (www to non-www or vice versa)

### Example DNS Configuration
```
Type    Name    Value                   TTL
A       @       your-server-ip         300
CNAME   www     your-domain.com        300
MX      @       mail.your-domain.com   300
```

## Performance Optimization

### Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## Testing & Quality Assurance

### Testing Checklist
- [ ] Unit tests for all utilities
- [ ] Integration tests for API routes
- [ ] E2E tests for critical user flows
- [ ] Payment processing tests
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] Performance testing
- [ ] Security testing

### Example Test
```javascript
// __tests__/api/products.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/products';

describe('/api/products', () => {
  it('returns products', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('products');
  });
});
```

## Go-Live Checklist

### Pre-Launch (1 week before)
- [ ] Complete security audit
- [ ] Load testing
- [ ] Backup procedures tested
- [ ] Monitoring alerts configured
- [ ] Staff training completed
- [ ] Legal pages updated (Privacy Policy, Terms of Service)
- [ ] Payment processing tested
- [ ] Email templates tested
- [ ] Mobile app tested (if applicable)

### Launch Day
- [ ] Deploy to production
- [ ] Verify all integrations working
- [ ] Test complete purchase flow
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify analytics tracking
- [ ] Test customer support channels

### Post-Launch (First 48 hours)
- [ ] Monitor server performance
- [ ] Check for any critical errors
- [ ] Verify payment processing
- [ ] Monitor user feedback
- [ ] Check email delivery
- [ ] Verify inventory synchronization
- [ ] Test order fulfillment process

## Maintenance & Updates

### Regular Tasks
- [ ] Security updates
- [ ] Performance monitoring
- [ ] Backup verification
- [ ] Inventory audits
- [ ] Analytics review
- [ ] Customer feedback analysis
- [ ] A/B testing implementation

### Monthly Reviews
- [ ] Performance metrics
- [ ] Security scans
- [ ] Dependency updates
- [ ] Database optimization
- [ ] CDN cache analysis
- [ ] Error rate analysis

## Support & Documentation

### Customer Support
- Set up help desk system (Zendesk, Intercom)
- Create knowledge base
- Configure live chat
- Set up email support
- Create return/refund processes

### Internal Documentation
- API documentation
- Deployment procedures
- Troubleshooting guides
- Staff training materials
- Emergency procedures

## Conclusion

This deployment guide provides a comprehensive roadmap for taking your MaisonMiaro e-commerce website from development to production. Remember to:

1. Test thoroughly in a staging environment
2. Have rollback procedures ready
3. Monitor closely after launch
4. Keep documentation updated
5. Plan for scalability

For specific questions about any integration or deployment step, consult the official documentation for each service or contact their support teams.
