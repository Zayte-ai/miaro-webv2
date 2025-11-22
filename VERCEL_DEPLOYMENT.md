# Vercel Deployment Guide for MaisonMiaro

This guide will walk you through deploying your MaisonMiaro e-commerce site to Vercel.

## Prerequisites

- GitHub account with your code pushed
- Vercel account (sign up at https://vercel.com)
- PostgreSQL database (recommended: Vercel Postgres or Neon)

## Step 1: Set Up PostgreSQL Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to "Storage" → "Create Database"
3. Select "Postgres"
4. Choose your region (closest to your users)
5. Click "Create"
6. Copy the connection strings (you'll need both `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING`)

### Option B: Neon (Free Tier Available)

1. Sign up at https://neon.tech
2. Create a new project
3. Get your connection string
4. Note: You'll need both pooled and direct connection strings

## Step 2: Deploy to Vercel

### Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository (Kingdragoncat/Miaro)
3. Configure your project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave default (.next)

### Environment Variables

Click "Add Environment Variables" and add the following:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public&pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/database?schema=public

# Admin Credentials (REQUIRED - CHANGE THESE!)
ADMIN_EMAIL=admin@maisonmiaro.com
ADMIN_PASSWORD=YourSecurePasswordHere123!

# JWT Secret (REQUIRED - Generate a secure random string)
JWT_SECRET=your-super-secure-random-jwt-secret-minimum-32-characters

# Application (REQUIRED)
NEXT_PUBLIC_API_URL=https://your-app.vercel.app

# Seed Configuration (Optional)
SEED_DEMO_DATA=false

# Email Configuration (Optional - for contact form)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
CONTACT_EMAIL=contact@maisonmiaro.com

# Stripe (Optional - if using Stripe)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

**Important Notes:**
- For `DATABASE_URL`: Use the **pooled connection string** (with pgbouncer=true)
- For `DIRECT_URL`: Use the **direct connection string** (without pgbouncer)
- Generate JWT_SECRET with: `openssl rand -base64 32`
- Change the default admin password!

4. Click "Deploy"

## Step 3: Run Database Migrations

After deployment, you need to set up your database:

### Method 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Link your project:
```bash
vercel link
```

4. Pull environment variables:
```bash
vercel env pull .env.local
```

5. Run migrations:
```bash
npx prisma migrate deploy
```

6. Seed the database (creates admin user):
```bash
npm run db:seed
```

### Method 2: Using Database GUI

1. Get your database credentials from Vercel
2. Use a tool like TablePlus, pgAdmin, or Prisma Studio
3. Manually run the migration SQL from `prisma/migrations/`

## Step 4: Verify Deployment

1. Visit your Vercel deployment URL
2. Test the homepage loads
3. Try logging into admin panel:
   - URL: `https://your-app.vercel.app/admin/login`
   - Email: Your `ADMIN_EMAIL`
   - Password: Your `ADMIN_PASSWORD`

## Step 5: Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow Vercel's DNS configuration instructions
5. Update `NEXT_PUBLIC_API_URL` environment variable to your custom domain

## Important Post-Deployment Tasks

### 1. Create Admin User

If you haven't seeded the database yet:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run db:seed
```

Or use the fix-admin script:
```bash
npx tsx scripts/fix-admin.ts
```

### 2. Remove Demo Data (if seeded)

```bash
npx tsx scripts/delete-demo-products.ts
```

### 3. Set Up Contact Form Email (Optional)

To receive contact form submissions via email:

1. Set up email service (Gmail, SendGrid, etc.)
2. Update environment variables:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `CONTACT_EMAIL`
3. Uncomment email sending code in `/src/app/api/contact/route.ts`

### 4. Configure Stripe (if using payments)

1. Get your Stripe keys from https://dashboard.stripe.com
2. Add to environment variables
3. Set up webhook endpoint in Stripe dashboard:
   - URL: `https://your-app.vercel.app/api/webhooks/stripe/checkout`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`

## Troubleshooting

### Build Failures

**Error: Cannot find module '@prisma/client'**
- Solution: Ensure `postinstall` script is in package.json: `"postinstall": "prisma generate"`

**Error: Database connection failed**
- Check your `DATABASE_URL` and `DIRECT_URL` environment variables
- Ensure database is accessible from Vercel's IP ranges
- Verify connection strings are correct

**Error: Build timeout**
- Upgrade to Vercel Pro if needed (hobby plan has 45s build limit)
- Or optimize your build by reducing dependencies

### Runtime Issues

**Error: JWT secret not configured**
- Set `JWT_SECRET` environment variable
- Must be at least 32 characters

**Admin login fails with "account inactive"**
- Run the fix-admin script: `npx tsx scripts/fix-admin.ts`
- Or manually update database: `UPDATE admins SET "isActive" = true`

**Contact form not working**
- Check browser console for errors
- Verify API endpoint is accessible: `/api/contact`
- Check Vercel function logs

### Database Issues

**Error: Connection pool exhausted**
- You're likely using `DIRECT_URL` for your app
- Ensure `DATABASE_URL` uses the pooled connection (with pgbouncer=true)

**Error: Migration failed**
- Make sure you're using the `DIRECT_URL` for migrations
- Run: `npx prisma migrate deploy`

## Environment Variables Quick Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | ✅ Yes | PostgreSQL connection string (direct) |
| `ADMIN_EMAIL` | ✅ Yes | Admin login email |
| `ADMIN_PASSWORD` | ✅ Yes | Admin login password |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT tokens (min 32 chars) |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Your deployment URL |
| `SEED_DEMO_DATA` | ❌ No | Whether to create demo products (false) |
| `SMTP_*` | ❌ No | Email configuration for contact form |
| `STRIPE_*` | ❌ No | Stripe payment configuration |

## Continuous Deployment

Vercel automatically deploys when you push to your main branch:

1. Make changes locally
2. Commit: `git commit -m "Your message"`
3. Push: `git push origin main`
4. Vercel automatically builds and deploys

For preview deployments, push to any branch:
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

Vercel creates a preview URL for each branch.

## Useful Commands

```bash
# View deployment logs
vercel logs

# List all deployments
vercel ls

# Redeploy last deployment
vercel --prod

# Run Prisma Studio (database GUI)
npm run db:studio

# View contact messages
npm run db:studio
# Then navigate to "contact_messages" table
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated secure JWT_SECRET (32+ characters)
- [ ] Set up HTTPS (automatic with Vercel)
- [ ] Configured environment variables properly
- [ ] Database credentials are secure
- [ ] Removed or disabled demo data in production
- [ ] Set up proper CORS if needed
- [ ] Configured Stripe webhook secrets (if using Stripe)

## Support

For issues:
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

## Next Steps

1. **Add Products**: Login to `/admin/dashboard/products`
2. **Configure Settings**: Update store settings in admin panel
3. **Test Orders**: Place a test order
4. **Set Up Analytics**: Configure Google Analytics or Vercel Analytics
5. **Email Marketing**: Integrate with Mailchimp, SendGrid, etc.
6. **Monitor**: Set up error tracking (Sentry, LogRocket, etc.)

---

**Congratulations!** Your MaisonMiaro store is now live on Vercel! 🎉
