# Changelog - Admin Auth & Contact Form Fixes

## Changes Made (2025-11-07)

### 1. **Fixed Admin Authentication**

#### Problem
- Admin credentials were hardcoded in the seed file
- Environment variables (ADMIN_EMAIL, ADMIN_PASSWORD) were not being used
- Admin account inactive status was causing login issues

#### Solution
- Updated `prisma/seed.ts` to read admin credentials from environment variables
- Added `isActive: true` to ensure admin account is always active on seed
- Created `.env` file with configurable admin credentials
- Created `scripts/fix-admin.ts` utility to check and fix admin account status

#### Files Changed
- `prisma/seed.ts` - Now uses environment variables for admin credentials
- `.env` - Added with admin credentials configuration
- `scripts/fix-admin.ts` - New utility script to fix admin account issues

#### How to Use
1. Edit `.env` file and set your desired admin credentials:
   ```env
   ADMIN_EMAIL=your-email@example.com
   ADMIN_PASSWORD=YourSecurePassword123!
   ```

2. Run the seed to update admin credentials:
   ```bash
   npm run db:seed
   ```

3. Or use the fix script to update existing admin:
   ```bash
   npx tsx scripts/fix-admin.ts
   ```

### 2. **Removed Demo Products**

#### Problem
- Shop was displaying demo products from seed data
- No way to prevent demo data creation

#### Solution
- Added `SEED_DEMO_DATA` environment variable (default: false)
- Created `scripts/delete-demo-products.ts` to remove existing demo data
- Updated seed script to skip demo data when `SEED_DEMO_DATA=false`

#### Files Changed
- `prisma/seed.ts` - Added conditional demo data creation
- `.env` - Added SEED_DEMO_DATA=false flag
- `scripts/delete-demo-products.ts` - New utility to delete demo data

#### How to Use
- Demo products have been removed from the database
- To prevent demo data on future seeds, keep `SEED_DEMO_DATA=false` in `.env`
- To create demo data for testing, set `SEED_DEMO_DATA=true` and run seed

### 3. **Implemented Contact Form**

#### Problem
- Contact form had no submission handler
- No database model for storing contact messages
- No API endpoint to receive form submissions

#### Solution
- Added `ContactMessage` model to Prisma schema
- Created `/api/contact` endpoint with POST handler
- Updated contact page to submit form data
- Added form validation and error handling
- Added success/error feedback to users

#### Files Changed
- `prisma/schema.prisma` - Added ContactMessage model
- `src/app/api/contact/route.ts` - New API endpoint
- `src/app/contact/page.tsx` - Updated with form submission logic

#### Features
- Server-side validation using Zod
- Stores all contact messages in database
- Success/error feedback to users
- Form automatically clears on successful submission
- Admin can view messages via GET endpoint (authentication needed)

### 4. **Database Schema Updates**

#### Changes
- Added `ContactMessage` model to store contact form submissions
- Applied schema changes using `prisma db push`

#### Fields in ContactMessage
- firstName, lastName, email
- subject, message
- isRead, isReplied (for admin management)
- createdAt, updatedAt

### 5. **Dependencies Added**

New dependencies installed:
- `zod` - For form validation
- `nodemailer` - For email functionality (ready for future use)
- `@types/nodemailer` - TypeScript types
- `lightningcss` - Required by Tailwind v4

## Configuration Files

### .env
```env
# Database
DATABASE_URL="file:./dev.db"

# Admin Credentials (CHANGE THESE!)
ADMIN_EMAIL=admin@maisonmiaro.com
ADMIN_PASSWORD=YourSecurePassword123!

# Seed Configuration
SEED_DEMO_DATA=false

# JWT Secret
JWT_SECRET=your-secret-key-change-this-in-production

# Email Configuration (for future use)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
CONTACT_EMAIL=contact@maisonmiaro.com

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Scripts Created

### 1. `scripts/fix-admin.ts`
Checks and fixes admin account issues:
- Updates admin password from .env
- Sets isActive to true
- Creates admin if doesn't exist

Usage:
```bash
npx tsx scripts/fix-admin.ts
```

### 2. `scripts/delete-demo-products.ts`
Removes all demo data from database:
- Deletes all products and related data
- Deletes categories and options
- Deletes demo customer
- Keeps admin account intact

Usage:
```bash
npx tsx scripts/delete-demo-products.ts
```

## Testing

### Admin Login
1. Navigate to `/admin/login`
2. Use credentials from .env file:
   - Email: `admin@maisonmiaro.com` (or your custom email)
   - Password: `YourSecurePassword123!` (or your custom password)
3. Should successfully log in

### Contact Form
1. Navigate to `/contact`
2. Fill out the form with all required fields
3. Submit the form
4. Should see success message
5. Message is stored in database (check with Prisma Studio)

## Next Steps

To view contact messages in the admin panel, you'll need to:
1. Create an admin page for viewing contact messages
2. Add authentication check to the GET endpoint in `/api/contact`
3. Optionally: Set up email notifications when new messages arrive

## Migration Notes

- Deleted old PostgreSQL migrations as project now uses SQLite
- Used `prisma db push` to apply schema changes
- Database file: `prisma/dev.db`

## Known Issues

- Build fails due to Tailwind v4 native binding issues in Docker environment
- This doesn't affect development mode (`npm run dev`)
- Contact form email notifications not yet implemented (ready for setup)
