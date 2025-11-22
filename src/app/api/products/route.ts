import { NextRequest, NextResponse } from 'next/server';
import { products, searchProducts } from '@/lib/data';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Create a new product in the database (not implemented - use admin API)
export async function POST(request: NextRequest) {
  return NextResponse.json({ success: false, error: 'Use /api/admin/products for product creation' }, { status: 403 });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Get query parameters
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    let filteredProducts = products;

    // Apply search
    if (search) {
      filteredProducts = searchProducts(search);
    }

    // Apply filters
    if (category) {
      filteredProducts = filteredProducts.filter(
        (product) => product.category.slug === category
      );
    }

    if (minPrice) {
      filteredProducts = filteredProducts.filter(
        (product) => product.price >= parseFloat(minPrice)
      );
    }

    if (maxPrice) {
      filteredProducts = filteredProducts.filter(
        (product) => product.price <= parseFloat(maxPrice)
      );
    }

    if (inStock === 'true') {
      filteredProducts = filteredProducts.filter((product) => product.inStock);
    }

    if (featured === 'true') {
      filteredProducts = filteredProducts.filter((product) => product.featured);
    }

    // Pagination
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
