import { Product, Category, Size, Color } from '@/types';

// Mock categories
export const categories: Category[] = [
  { id: '1', name: 'T-Shirts', slug: 't-shirts' },
  { id: '2', name: 'Hoodies', slug: 'hoodies' },
  { id: '3', name: 'Jeans', slug: 'jeans' },
  { id: '4', name: 'Jackets', slug: 'jackets' },
  { id: '5', name: 'Accessories', slug: 'accessories' },
];

// Mock sizes
export const sizes: Size[] = [
  { id: '1', name: 'Extra Small', value: 'XS' },
  { id: '2', name: 'Small', value: 'S' },
  { id: '3', name: 'Medium', value: 'M' },
  { id: '4', name: 'Large', value: 'L' },
  { id: '5', name: 'Extra Large', value: 'XL' },
  { id: '6', name: 'Double XL', value: 'XXL' },
];

// Mock colors
export const colors: Color[] = [
  { id: '1', name: 'Black', hex: '#000000' },
  { id: '2', name: 'White', hex: '#FFFFFF' },
  { id: '3', name: 'Navy', hex: '#1F2937' },
  { id: '4', name: 'Gray', hex: '#6B7280' },
  { id: '5', name: 'Beige', hex: '#F3F4F6' },
  { id: '6', name: 'Brown', hex: '#92400E' },
];

// Mock products
export const products: Product[] = [
  {
    id: '1',
    name: 'Classic White Tee',
    description: 'A timeless white t-shirt made from premium organic cotton. Perfect for everyday wear with a comfortable fit and durable construction.',
    price: 29.99,
  images: ['/project/360/001.jpg'],
  imageFrames: 36,
    model3d: '/models/white-tee.glb',
    category: categories[0],
    sizes: sizes.slice(0, 5),
    colors: [colors[1], colors[0], colors[3]],
    inStock: true,
    featured: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Oversized Hoodie',
    description: 'Ultra-comfortable oversized hoodie with a modern fit. Features a soft fleece interior and adjustable drawstring hood.',
    price: 79.99,
    images: ['/images/products/hoodie-1.jpg', '/images/products/hoodie-2.jpg'],
    imageFrames: 35,
    model3d: '/models/hoodie.glb',
    category: categories[1],
    sizes: sizes.slice(1, 6),
    colors: [colors[0], colors[2], colors[3]],
    inStock: true,
    featured: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    name: 'Slim Fit Jeans',
    description: 'Premium denim jeans with a modern slim fit. Crafted from high-quality stretch denim for comfort and style.',
    price: 89.99,
    images: ['/images/products/jeans-1.jpg', '/images/products/jeans-2.jpg'],
    imageFrames: 35,
    model3d: '/models/jeans.glb',
    category: categories[2],
    sizes: sizes.slice(0, 6),
    colors: [colors[2], colors[0], colors[5]],
    inStock: true,
    featured: false,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '4',
    name: 'Leather Jacket',
    description: 'Classic leather jacket with a modern twist. Made from genuine leather with attention to detail and craftsmanship.',
    price: 199.99,
    images: ['/images/products/jacket-1.jpg', '/images/products/jacket-2.jpg'],
    imageFrames: 35,
    model3d: '/models/jacket.glb',
    category: categories[3],
    sizes: sizes.slice(1, 5),
    colors: [colors[0], colors[5]],
    inStock: true,
    featured: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '5',
    name: 'Cotton Beanie',
    description: 'Soft cotton beanie perfect for any season. Features the MaisonMiaro logo embroidered with premium thread.',
    price: 24.99,
    images: ['/images/products/beanie-1.jpg', '/images/products/beanie-2.jpg'],
    imageFrames: 35,
    category: categories[4],
    sizes: [{ id: 'os', name: 'One Size', value: 'OS' }],
    colors: [colors[0], colors[2], colors[3]],
    inStock: true,
    featured: false,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    id: '6',
    name: 'Demo 360 Item',
    description: 'Demo product showing 360° image rotation. Use drag or slider to rotate.',
    price: 49.99,
    images: ['/images/products/6/001.jpg'],
    imageFrames: 36,
    category: categories[4],
    sizes: [{ id: 'os', name: 'One Size', value: 'OS' }],
    colors: [colors[0]],
    inStock: true,
    featured: false,
    createdAt: new Date('2024-03-01T00:00:00.000Z'),
    updatedAt: new Date('2024-03-01T00:00:00.000Z'),
  },
];

// Function to get products by category
export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((product) => product.category.slug === categorySlug);
}

// Function to get featured products
export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured);
}

// Function to get product by ID
export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

// Function to search products
export function searchProducts(query: string): Product[] {
  const lowercaseQuery = query.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery) ||
      product.category.name.toLowerCase().includes(lowercaseQuery)
  );
}

// Admin management functions
let _nextCategoryId = 100;
export const addCategory = (category: Omit<Category, 'id'>): Category => {
  const newCategory: Category = {
    ...category,
    id: String(_nextCategoryId++),
  };
  categories.push(newCategory);
  return newCategory;
};

export const deleteCategory = (categoryId: string): boolean => {
  const index = categories.findIndex(c => c.id === categoryId);
  if (index > -1) {
    categories.splice(index, 1);
    // Also remove products in this category
    for (let i = products.length - 1; i >= 0; i--) {
      if (products[i].category.id === categoryId) {
        products.splice(i, 1);
      }
    }
    return true;
  }
  return false;
};

let _nextProductId = 1000;
export const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
  const newProduct: Product = {
    ...productData,
    id: String(_nextProductId++),
    createdAt: new Date('2024-03-01T00:00:00.000Z'),
    updatedAt: new Date('2024-03-01T00:00:00.000Z'),
  };
  products.push(newProduct);
  return newProduct;
};

export const updateProduct = (productId: string, productData: Partial<Product>): Product | null => {
  const index = products.findIndex(p => p.id === productId);
  if (index > -1) {
    products[index] = {
      ...products[index],
      ...productData,
      updatedAt: new Date(),
    };
    return products[index];
  }
  return null;
};

export const deleteProduct = (productId: string): boolean => {
  const index = products.findIndex(p => p.id === productId);
  if (index > -1) {
    products.splice(index, 1);
    return true;
  }
  return false;
};
