# MaisonMiaro - Professional Clothing Website

A modern, professional e-commerce website for MaisonMiaro clothing brand, featuring 3D product visualization, responsive design, and full shopping cart functionality.

## 🚀 Quick Start

**First time setup?** Follow these guides:

1. **[SETUP.md](./SETUP.md)** - Complete installation and setup instructions
2. **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Step-by-step testing guide
3. **[STRIPE_SETUP.md](./STRIPE_SETUP.md)** - Stripe payment integration guide
4. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide

## Features

- **Modern Design**: Clean, minimalist design showcasing clothing with professional aesthetics
- **3D Product Viewer**: Interactive 3D models for clothing items using Three.js/React Three Fiber
- **Product Catalog**: Complete product listing with filtering, search, and categories
- **Shopping Cart**: Full cart functionality with persistent state management
- **User Authentication**: Complete auth system with JWT tokens
- **Payment Processing**: Stripe integration for secure checkout
- **Admin Dashboard**: Product and order management with analytics
- **Responsive Design**: Mobile-first design that works on all devices
- **Backend API**: RESTful API endpoints for product management
- **Database**: PostgreSQL with Prisma ORM
- **TypeScript**: Fully typed for better development experience
- **Performance Optimized**: Built with Next.js 15 for optimal performance

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **3D Rendering**: Three.js, React Three Fiber, Drei
- **State Management**: Zustand for cart and user state
- **Icons**: Lucide React
- **Development**: ESLint, TypeScript, Hot Reload

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL (or use SQLite for quick testing)
- Stripe account (free test account)

### Quick Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database:**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

📚 **Need detailed instructions?** See [SETUP.md](./SETUP.md)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:studio` - Open Prisma Studio (database viewer)
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with sample data
- `npm run db:migrate` - Run database migrations

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # Backend API routes
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/         # Reusable React components
│   ├── Navbar.tsx      # Navigation component
│   ├── Footer.tsx      # Footer component
│   ├── ProductCard.tsx # Product display card
│   └── Product3DViewer.tsx # 3D model viewer
├── lib/                # Utility functions
│   ├── data.ts         # Mock product data
│   └── utils.ts        # Helper functions
├── store/              # State management
│   ├── cart.ts         # Shopping cart store
│   └── user.ts         # User authentication store
└── types/              # TypeScript type definitions
    └── index.ts        # All type definitions

public/
├── images/             # Product images (to be added)
└── models/             # 3D model files (to be added)
```

## Testing

Complete testing checklist available in [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

### Quick Test Flow

1. Browse products at `/shop`
2. Add items to cart
3. Test checkout with Stripe test card: `4242 4242 4242 4242`
4. Create user account at `/auth/register`
5. View orders at `/account/orders`
6. Admin login at `/admin/login` (use credentials from `.env`)

## API Endpoints

### Public API
- `GET /api/products` - Get all products
- `GET /api/products/[id]` - Get product by ID

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset

### Payments
- `POST /api/payments/stripe/create-checkout-session` - Create Stripe checkout
- `POST /api/payments/stripe/create-intent` - Create payment intent

### Admin API
- `POST /api/admin/auth` - Admin login
- `GET /api/admin/products` - Get all products (admin)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product
- `GET /api/admin/analytics/*` - Various analytics endpoints

## Environment Variables

Required environment variables (see `.env.example`):

```env
DATABASE_URL=              # PostgreSQL connection string
JWT_SECRET=                # Secret for JWT tokens
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe public key
STRIPE_SECRET_KEY=         # Stripe secret key
STRIPE_WEBHOOK_SECRET=     # Stripe webhook secret
NEXT_PUBLIC_APP_URL=       # App URL (http://localhost:3000)
ADMIN_EMAIL=               # Admin email
ADMIN_PASSWORD=            # Admin password
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options

- **Vercel** (Recommended for Next.js)
- **Netlify**
- **Railway** (includes PostgreSQL)
- **Heroku**
- **DigitalOcean**

## Troubleshooting

Common issues and solutions in [SETUP.md](./SETUP.md#troubleshooting)

## Documentation

- [SETUP.md](./SETUP.md) - Complete setup guide
- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Testing checklist
- [STRIPE_SETUP.md](./STRIPE_SETUP.md) - Stripe configuration
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [ADMIN_STRIPE_INTEGRATION.md](./ADMIN_STRIPE_INTEGRATION.md) - Admin features

## Development

This website is built for MaisonMiaro clothing brand with enterprise-level features and scalability. The codebase follows modern best practices and is structured for easy maintenance and feature additions.

## License

Private - All rights reserved by MaisonMiaro
