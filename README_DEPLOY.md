# MaisonMiaro E-Commerce Platform

A modern, full-featured e-commerce platform built with Next.js 15, TypeScript, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/Kingdragoncat/Miaro.git
cd Miaro
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure your settings (see Environment Variables section below).

4. **Set up database**

For local development with PostgreSQL:
```bash
# Run migrations
npx prisma migrate dev

# Seed database (creates admin user)
npm run db:seed
```

5. **Start development server**
```bash
npm run dev
```

Visit http://localhost:3000

### Admin Panel

Access the admin panel at `/admin/login`:
- Email: From your `ADMIN_EMAIL` env variable
- Password: From your `ADMIN_PASSWORD` env variable

## 📦 Features

### Customer Features
- 🛍️ Product browsing and search
- 🛒 Shopping cart functionality
- 👤 User authentication and profiles
- ❤️ Wishlist
- 📦 Order tracking
- ⭐ Product reviews
- 📱 Responsive design
- 📧 Contact form

### Admin Features
- 📊 Dashboard with analytics
- 🏷️ Product management (CRUD operations)
- 📦 Order management
- 👥 Customer management
- 📂 Category management
- 📮 View contact form submissions
- 📈 Sales analytics
- 🚚 Shipping integration (FedEx)

## 🚀 Deploy to Vercel

**See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete deployment instructions.**

Quick deploy:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Kingdragoncat/Miaro)

---

**For detailed documentation, deployment guides, and more, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)**
