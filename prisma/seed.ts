import { PrismaClient, AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Get admin credentials from environment variables
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@maisonmiaro.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const seedDemoData = process.env.SEED_DEMO_DATA !== 'false'; // Default to true unless explicitly set to 'false'

  // Create admin user with credentials from .env
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      // Update password and ensure account is active on re-seed
      passwordHash: adminPasswordHash,
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('👤 Created/Updated admin user:', admin.email);
  console.log('🔑 Admin password set from ADMIN_PASSWORD env variable');

  if (!seedDemoData) {
    console.log('⏭️  Skipping demo data creation (SEED_DEMO_DATA=false)');
    return;
  }

  // Create demo customer
  const customerPasswordHash = await bcrypt.hash('password123', 12);
  
  const customer = await prisma.user.upsert({
    where: { email: 'user@maisonmiaro.com' },
    update: {},
    create: {
      email: 'user@maisonmiaro.com',
      passwordHash: customerPasswordHash,
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-123-4567',
    },
  });

  console.log('👤 Created demo customer:', customer.email);

  // Create address for demo customer
  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Fashion Street',
      city: 'Style City',
      state: 'CA',
      zipCode: '90210',
      country: 'US',
      phone: '555-123-4567',
      isDefault: true,
    },
  });

  console.log('🏠 Created demo address');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 't-shirts' },
      update: {},
      create: {
        name: 'T-Shirts',
        slug: 't-shirts',
        description: 'Comfortable and stylish t-shirts for everyday wear',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'hoodies' },
      update: {},
      create: {
        name: 'Hoodies',
        slug: 'hoodies',
        description: 'Cozy hoodies and sweatshirts',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'jeans' },
      update: {},
      create: {
        name: 'Jeans',
        slug: 'jeans',
        description: 'Premium denim jeans in various fits',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'jackets' },
      update: {},
      create: {
        name: 'Jackets',
        slug: 'jackets',
        description: 'Stylish outerwear for all seasons',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Complete your look with our accessories',
        sortOrder: 5,
      },
    }),
  ]);

  console.log('📂 Created categories:', categories.map(c => c.name).join(', '));

  // Create size options
  const sizeOption = await prisma.option.upsert({
    where: { name: 'Size' },
    update: {},
    create: {
      name: 'Size',
      type: 'SIZE',
      sortOrder: 1,
    },
  });

  const sizeValues = await Promise.all([
    prisma.optionValue.upsert({
      where: { id: 'xs-size' },
      update: {},
      create: {
        id: 'xs-size',
        optionId: sizeOption.id,
        value: 'XS',
        label: 'Extra Small',
        sortOrder: 1,
      },
    }),
    prisma.optionValue.upsert({
      where: { id: 's-size' },
      update: {},
      create: {
        id: 's-size',
        optionId: sizeOption.id,
        value: 'S',
        label: 'Small',
        sortOrder: 2,
      },
    }),
    prisma.optionValue.upsert({
      where: { id: 'm-size' },
      update: {},
      create: {
        id: 'm-size',
        optionId: sizeOption.id,
        value: 'M',
        label: 'Medium',
        sortOrder: 3,
      },
    }),
    prisma.optionValue.upsert({
      where: { id: 'l-size' },
      update: {},
      create: {
        id: 'l-size',
        optionId: sizeOption.id,
        value: 'L',
        label: 'Large',
        sortOrder: 4,
      },
    }),
    prisma.optionValue.upsert({
      where: { id: 'xl-size' },
      update: {},
      create: {
        id: 'xl-size',
        optionId: sizeOption.id,
        value: 'XL',
        label: 'Extra Large',
        sortOrder: 5,
      },
    }),
    prisma.optionValue.upsert({
      where: { id: 'xxl-size' },
      update: {},
      create: {
        id: 'xxl-size',
        optionId: sizeOption.id,
        value: 'XXL',
        label: 'Double Extra Large',
        sortOrder: 6,
      },
    }),
  ]);

  // Create color options
  const colorOption = await prisma.option.upsert({
    where: { name: 'Color' },
    update: {},
    create: {
      name: 'Color',
      type: 'COLOR',
      sortOrder: 2,
    },
  });

  const colorValues = await Promise.all([
    prisma.optionValue.upsert({
      where: { id: 'black-color' },
      update: {},
      create: {
        id: 'black-color',
        optionId: colorOption.id,
        value: 'Black',
        label: 'Black',
        hexCode: '#000000',
        sortOrder: 1,
      },
    }),
    prisma.optionValue.upsert({
      where: { id: 'white-color' },
      update: {},
      create: {
        id: 'white-color',
        optionId: colorOption.id,
        value: 'White',
        label: 'White',
        hexCode: '#FFFFFF',
        sortOrder: 2,
      },
    }),
    prisma.optionValue.upsert({
      where: { id: 'navy-color' },
      update: {},
      create: {
        id: 'navy-color',
        optionId: colorOption.id,
        value: 'Navy',
        label: 'Navy Blue',
        hexCode: '#1F2937',
        sortOrder: 3,
      },
    }),
    prisma.optionValue.upsert({
      where: { id: 'gray-color' },
      update: {},
      create: {
        id: 'gray-color',
        optionId: colorOption.id,
        value: 'Gray',
        label: 'Gray',
        hexCode: '#6B7280',
        sortOrder: 4,
      },
    }),
  ]);

  console.log('🎨 Created product options and values');

  // Create products
  const tshirtCategory = categories.find(c => c.slug === 't-shirts')!;
  const hoodieCategory = categories.find(c => c.slug === 'hoodies')!;
  const jeansCategory = categories.find(c => c.slug === 'jeans')!;
  const jacketCategory = categories.find(c => c.slug === 'jackets')!;
  const accessoryCategory = categories.find(c => c.slug === 'accessories')!;

  // T-Shirt Product
  const tshirt = await prisma.product.create({
    data: {
      name: 'Classic White Tee',
      slug: 'classic-white-tee',
      description: 'A timeless white t-shirt made from premium organic cotton. Perfect for everyday wear with a comfortable fit and durable construction.',
      shortDescription: 'Premium organic cotton t-shirt',
      sku: 'MM-TEE-001',
      price: 29.99,
      comparePrice: 39.99,
      costPrice: 15.00,
      categoryId: tshirtCategory.id,
      isFeatured: true,
      isActive: true,
      publishedAt: new Date(),
      metaTitle: 'Classic White Tee - MaisonMiaro',
      metaDescription: 'Premium organic cotton white t-shirt. Comfortable, durable, and timeless design.',
      images: {
        create: [
          {
            url: '/images/products/white-tee-1.jpg',
            altText: 'Classic White Tee - Front View',
            sortOrder: 1,
          },
          {
            url: '/images/products/white-tee-2.jpg',
            altText: 'Classic White Tee - Back View',
            sortOrder: 2,
          },
        ],
      },
      inventory: {
        create: {
          quantity: 100,
          lowStockThreshold: 10,
        },
      },
    },
  });

  // Create T-shirt variants
  const tshirtVariants = await Promise.all([
    // White variants
    prisma.productVariant.create({
      data: {
        productId: tshirt.id,
        name: 'White - Small',
        sku: 'MM-TEE-001-W-S',
        sortOrder: 1,
        variantOptions: {
          create: [
            { optionId: sizeOption.id, value: 'S' },
            { optionId: colorOption.id, value: 'White' },
          ],
        },
        inventory: {
          create: { quantity: 25 },
        },
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: tshirt.id,
        name: 'White - Medium',
        sku: 'MM-TEE-001-W-M',
        sortOrder: 2,
        variantOptions: {
          create: [
            { optionId: sizeOption.id, value: 'M' },
            { optionId: colorOption.id, value: 'White' },
          ],
        },
        inventory: {
          create: { quantity: 30 },
        },
      },
    }),
    prisma.productVariant.create({
      data: {
        productId: tshirt.id,
        name: 'White - Large',
        sku: 'MM-TEE-001-W-L',
        sortOrder: 3,
        variantOptions: {
          create: [
            { optionId: sizeOption.id, value: 'L' },
            { optionId: colorOption.id, value: 'White' },
          ],
        },
        inventory: {
          create: { quantity: 25 },
        },
      },
    }),
    // Black variants
    prisma.productVariant.create({
      data: {
        productId: tshirt.id,
        name: 'Black - Medium',
        sku: 'MM-TEE-001-B-M',
        sortOrder: 4,
        variantOptions: {
          create: [
            { optionId: sizeOption.id, value: 'M' },
            { optionId: colorOption.id, value: 'Black' },
          ],
        },
        inventory: {
          create: { quantity: 20 },
        },
      },
    }),
  ]);

  // Hoodie Product
  const hoodie = await prisma.product.create({
    data: {
      name: 'Oversized Hoodie',
      slug: 'oversized-hoodie',
      description: 'Ultra-comfortable oversized hoodie with a modern fit. Features a soft fleece interior and adjustable drawstring hood.',
      shortDescription: 'Comfortable oversized hoodie',
      sku: 'MM-HOOD-001',
      price: 79.99,
      comparePrice: 99.99,
      costPrice: 40.00,
      categoryId: hoodieCategory.id,
      isFeatured: true,
      isActive: true,
      publishedAt: new Date(),
      images: {
        create: [
          {
            url: '/images/products/hoodie-1.jpg',
            altText: 'Oversized Hoodie - Front View',
            sortOrder: 1,
          },
          {
            url: '/images/products/hoodie-2.jpg',
            altText: 'Oversized Hoodie - Side View',
            sortOrder: 2,
          },
        ],
      },
      inventory: {
        create: {
          quantity: 75,
          lowStockThreshold: 5,
        },
      },
    },
  });

  // Jeans Product
  const jeans = await prisma.product.create({
    data: {
      name: 'Slim Fit Jeans',
      slug: 'slim-fit-jeans',
      description: 'Premium denim jeans with a modern slim fit. Crafted from high-quality stretch denim for comfort and style.',
      shortDescription: 'Premium slim fit denim jeans',
      sku: 'MM-JEAN-001',
      price: 89.99,
      comparePrice: 119.99,
      costPrice: 45.00,
      categoryId: jeansCategory.id,
      isFeatured: false,
      isActive: true,
      publishedAt: new Date(),
      images: {
        create: [
          {
            url: '/images/products/jeans-1.jpg',
            altText: 'Slim Fit Jeans - Front View',
            sortOrder: 1,
          },
          {
            url: '/images/products/jeans-2.jpg',
            altText: 'Slim Fit Jeans - Back View',
            sortOrder: 2,
          },
        ],
      },
      inventory: {
        create: {
          quantity: 60,
          lowStockThreshold: 8,
        },
      },
    },
  });

  // Leather Jacket Product
  const jacket = await prisma.product.create({
    data: {
      name: 'Leather Jacket',
      slug: 'leather-jacket',
      description: 'Classic leather jacket with a modern twist. Made from genuine leather with attention to detail and craftsmanship.',
      shortDescription: 'Premium genuine leather jacket',
      sku: 'MM-JACK-001',
      price: 199.99,
      comparePrice: 249.99,
      costPrice: 100.00,
      categoryId: jacketCategory.id,
      isFeatured: true,
      isActive: true,
      publishedAt: new Date(),
      images: {
        create: [
          {
            url: '/images/products/jacket-1.jpg',
            altText: 'Leather Jacket - Front View',
            sortOrder: 1,
          },
          {
            url: '/images/products/jacket-2.jpg',
            altText: 'Leather Jacket - Side View',
            sortOrder: 2,
          },
        ],
      },
      inventory: {
        create: {
          quantity: 25,
          lowStockThreshold: 3,
        },
      },
    },
  });

  // Cotton Beanie
  const beanie = await prisma.product.create({
    data: {
      name: 'Cotton Beanie',
      slug: 'cotton-beanie',
      description: 'Soft cotton beanie perfect for any season. Features the MaisonMiaro logo embroidered with premium thread.',
      shortDescription: 'Soft cotton beanie with logo',
      sku: 'MM-ACC-001',
      price: 24.99,
      comparePrice: 34.99,
      costPrice: 12.00,
      categoryId: accessoryCategory.id,
      isFeatured: false,
      isActive: true,
      publishedAt: new Date(),
      images: {
        create: [
          {
            url: '/images/products/beanie-1.jpg',
            altText: 'Cotton Beanie - Front View',
            sortOrder: 1,
          },
          {
            url: '/images/products/beanie-2.jpg',
            altText: 'Cotton Beanie - On Model',
            sortOrder: 2,
          },
        ],
      },
      inventory: {
        create: {
          quantity: 50,
          lowStockThreshold: 10,
        },
      },
    },
  });

  console.log('🛍️ Created products with inventory');

  // Create a sample order
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'MM-2025-0001',
      userId: customer.id,
      email: customer.email,
      billingAddressId: address.id,
      shippingAddressId: address.id,
      subtotal: 109.98,
      taxAmount: 8.80,
      shippingAmount: 10.00,
      totalAmount: 128.78,
      status: 'CONFIRMED',
      paymentStatus: 'CAPTURED',
      fulfillmentStatus: 'UNFULFILLED',
      tags: 'first-time-customer,discount-applied',
      items: {
        create: [
          {
            productId: tshirt.id,
            productVariantId: tshirtVariants[1].id, // White Medium
            quantity: 2,
            price: 29.99,
            totalPrice: 59.98,
          },
          {
            productId: hoodie.id,
            quantity: 1,
            price: 79.99,
            totalPrice: 79.99,
          },
        ],
      },
      payments: {
        create: {
          amount: 128.78,
          currency: 'USD',
          status: 'CAPTURED',
          method: 'CREDIT_CARD',
          gateway: 'stripe',
          gatewayTransactionId: 'ch_1234567890abcdef',
        },
      },
    },
  });

  console.log('📦 Created sample order:', sampleOrder.orderNumber);

  // Create a product review
  await prisma.review.create({
    data: {
      userId: customer.id,
      productId: tshirt.id,
      rating: 5,
      title: 'Amazing quality!',
      content: 'This t-shirt is incredibly comfortable and well-made. The fit is perfect and the material feels premium.',
      isVerifiedPurchase: true,
      isApproved: true,
    },
  });

  console.log('⭐ Created product review');

  // Add to wishlist
  await prisma.wishlistItem.create({
    data: {
      userId: customer.id,
      productId: jacket.id,
    },
  });

  console.log('❤️ Added item to wishlist');

  console.log('✅ Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });