# MaisonMiaro - Complete Setup & Testing Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Stripe Payment Setup](#stripe-payment-setup)
5. [Running the Application](#running-the-application)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)
8. [Important Notes](#important-notes)

---

## 1. Prerequisites

Before starting, make sure you have the following installed:

- **Node.js 18 or higher** - [Download here](https://nodejs.org/)
  - Check version: `node --version`
- **npm** (comes with Node.js)
  - Check version: `npm --version`
- **PostgreSQL** - [Download here](https://www.postgresql.org/download/)
  - Or use a cloud provider like [Supabase](https://supabase.com/) or [Railway](https://railway.app/)
- **Git** (optional, for version control)

---

## 2. Installation

### Step 1: Get the Project Files
If you received a ZIP file:
```bash
# Extract the ZIP file to a folder
# Open terminal/command prompt in that folder
```

If you have a Git repository:
```bash
git clone <repository-url>
cd Miaro
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all required packages (may take a few minutes).

---

## 3. Database Setup

### Option A: Using PostgreSQL (Recommended)

1. **Create a PostgreSQL database**
   - Using PostgreSQL locally:
     ```sql
     CREATE DATABASE maisonmiaro;
     ```
   - Or create a database using a cloud provider (Supabase, Railway, etc.)

2. **Configure environment variables**

   Create a `.env` file in the root directory by copying the example:
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file** with your database credentials:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/maisonmiaro"

   # JWT Secret for Authentication (generate a random string)
   JWT_SECRET=your_super_secret_jwt_key_here_change_this

   # Application Settings
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Admin Credentials (you can change these)
   ADMIN_EMAIL=admin@maisonmiaro.com
   ADMIN_PASSWORD=Admin123!
   ```

4. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```

6. **Seed the database** (populate with sample products)
   ```bash
   npm run db:seed
   ```

### Option B: Using SQLite (Quick Start for Testing)

If you don't want to set up PostgreSQL, you can use SQLite:

1. Edit `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. In your `.env` file:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. Then run:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

---

## 4. Stripe Payment Setup

### Step 1: Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Create a free account
3. Complete the registration process

### Step 2: Get API Keys
1. In Stripe Dashboard, go to **Developers → API Keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Step 3: Configure Stripe in `.env`
Add to your `.env` file:
```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
```

### Step 4: Set Up Webhook (Optional for Testing)
For local testing, you can skip this initially. For production:
1. Install Stripe CLI: [Instructions](https://stripe.com/docs/stripe-cli)
2. Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Copy the webhook secret and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

---

## 5. Running the Application

### Development Mode
```bash
npm run dev
```

The application will start at: **http://localhost:3000**

### Production Build
```bash
npm run build
npm start
```

### Additional Commands
- **View Database**: `npm run db:studio` (opens Prisma Studio at http://localhost:5555)
- **Lint Code**: `npm run lint`

---

## 6. Testing Guide

### 🎯 What to Test

#### A. Homepage & Navigation
1. **Visit http://localhost:3000**
   - ✅ Homepage should load with hero section
   - ✅ Navigation menu should be visible
   - ✅ Click "Shop" to see product categories

#### B. Product Browsing
1. **Browse Products**
   - Go to `/shop` or click "Shop" in navigation
   - ✅ Products should display in a grid
   - ✅ Click on different categories (T-Shirts, Hoodies, Jeans, etc.)
   - ✅ Search for products using the search bar

2. **Product Details**
   - Click on any product
   - ✅ Product images should display
   - ✅ 3D viewer should work (if models are available)
   - ✅ Product description, price, and sizes visible
   - ✅ "Add to Cart" button should work

#### C. Shopping Cart
1. **Add Items to Cart**
   - Add 2-3 different products
   - ✅ Cart icon should show item count
   - ✅ Click cart icon to view cart

2. **Cart Operations**
   - ✅ Increase/decrease quantities
   - ✅ Remove items
   - ✅ Cart total should update correctly
   - ✅ Cart persists on page refresh

#### D. User Authentication
1. **Register Account**
   - Click "Login/Register" or go to `/auth/register`
   - ✅ Create a new account
   - ✅ Check for validation errors

2. **Login**
   - Go to `/auth/login`
   - ✅ Login with your credentials
   - ✅ Should redirect to account page

3. **Password Reset**
   - Go to `/auth/forgot-password`
   - ✅ Enter your email
   - ✅ Check reset token functionality

#### E. Checkout Process
1. **Start Checkout**
   - Add items to cart
   - Click "Checkout" or go to `/checkout`
   - ✅ Should redirect to Stripe Checkout

2. **Test Payment** (Use Stripe Test Cards)
   - **Successful Payment**:
     - Card: `4242 4242 4242 4242`
     - Expiry: Any future date (e.g., 12/25)
     - CVC: Any 3 digits (e.g., 123)
   - **Declined Payment**:
     - Card: `4000 0000 0000 0002`
   - ✅ Success page should show after payment
   - ✅ Order should appear in account orders

#### F. Account Features
1. **Account Dashboard** (`/account`)
   - ✅ View profile information
   - ✅ Edit account settings

2. **Order History** (`/account/orders`)
   - ✅ View past orders
   - ✅ See order details and status

3. **Wishlist** (`/account/wishlist`)
   - ✅ Add products to wishlist
   - ✅ Remove from wishlist
   - ✅ Move to cart from wishlist

#### G. Admin Panel (if admin access configured)
1. **Admin Login**
   - Go to `/admin/login`
   - Use credentials from `.env`:
     - Email: `admin@maisonmiaro.com`
     - Password: (whatever you set in `.env`)

2. **Admin Features**
   - ✅ View analytics dashboard
   - ✅ Manage products (add/edit/delete)
   - ✅ View sales data
   - ✅ Export analytics

#### H. Responsive Design
1. **Mobile Testing**
   - Open Developer Tools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - ✅ Test on different screen sizes:
     - iPhone (375px)
     - iPad (768px)
     - Desktop (1920px)
   - ✅ Navigation should work on mobile
   - ✅ All features accessible

#### I. Performance & 3D Features
1. **3D Product Viewer**
   - Go to any product with 3D model
   - ✅ Model should load and be interactive
   - ✅ Rotate, zoom should work smoothly

2. **Page Load Speed**
   - ✅ Pages should load quickly
   - ✅ Images should be optimized
   - ✅ No console errors

---

## 7. Troubleshooting

### Common Issues

#### Issue: "Cannot connect to database"
**Solution:**
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Run: `npm run db:push` again

#### Issue: "Module not found" errors
**Solution:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

#### Issue: "Port 3000 already in use"
**Solution:**
- Close other applications using port 3000
- Or change port: `npm run dev -- -p 3001`

#### Issue: Stripe payments not working
**Solution:**
- Verify Stripe keys in `.env` are correct
- Use test card: `4242 4242 4242 4242`
- Check browser console for errors
- Ensure you're using Stripe test mode keys

#### Issue: Database seed fails
**Solution:**
```bash
# Reset database
npm run db:push -- --force-reset
npm run db:generate
npm run db:seed
```

#### Issue: 3D models not loading
**Solution:**
- Check `public/models/` folder exists
- Verify GLB files are present
- Check browser console for loading errors

#### Issue: Login/Authentication not working
**Solution:**
- Verify `JWT_SECRET` is set in `.env`
- Clear browser cookies/local storage
- Try registering a new account

#### Issue: Images not displaying
**Solution:**
- Check images exist in `public/images/products/`
- Verify image paths in database seed
- Check browser network tab for 404 errors

---

## 8. Important Notes

### Test Payment Cards (Stripe Test Mode)
Always use these test cards in development:

| Card Number | Description |
|------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |

**All test cards:**
- Use any future expiry date (e.g., 12/25)
- Use any 3-digit CVC (e.g., 123)
- Use any ZIP code (e.g., 12345)

### Security Reminders
- **NEVER commit `.env` file to Git**
- **Change default admin password** in production
- **Use strong JWT_SECRET** (at least 32 characters)
- **Enable HTTPS** in production

### Default Credentials
- **Admin Login**: Check `.env` for `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- **Test User**: Create via `/auth/register`

### Database Management
- **View Database**: `npm run db:studio`
- **Reset Database**: `npm run db:push -- --force-reset`
- **Backup Database**: Export from Prisma Studio or use PostgreSQL tools

### Next Steps
After successful testing:
1. Add real product images to `public/images/products/`
2. Add 3D models to `public/models/`
3. Configure production Stripe keys
4. Set up production database
5. Deploy to hosting (Vercel, Netlify, etc.)

---

## 🚀 Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Project dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Database set up and seeded
- [ ] Stripe keys added to `.env`
- [ ] Development server running (`npm run dev`)
- [ ] Homepage accessible at http://localhost:3000
- [ ] Can add products to cart
- [ ] Can complete test checkout with Stripe
- [ ] Can create user account
- [ ] Admin panel accessible (if configured)

---

## 📞 Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review error messages in terminal and browser console
3. Check that all environment variables are set correctly
4. Ensure database is running and accessible
5. Verify all dependencies are installed

**Additional Resources:**
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🎉 Success!

If you can:
- ✅ Browse products
- ✅ Add items to cart
- ✅ Complete a test checkout
- ✅ Create and login to account
- ✅ View orders in account

**Congratulations! The application is working correctly!** 🎊
