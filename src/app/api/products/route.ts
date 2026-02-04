import { NextRequest, NextResponse } from 'next/server';
import { getPublishedProducts } from '@/lib/prisma-products';

// POST: Create a new product in the database (not implemented - use admin API)
export async function POST(request: NextRequest) {
  return NextResponse.json({ success: false, error: 'Use /api/admin/products for product creation' }, { status: 403 });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const search = searchParams.get('search') || undefined;
    const categorySlug = searchParams.get('category') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const inStock = searchParams.get('inStock') === 'true' ? true : undefined;
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Fetch products from Prisma with filters
    const result = await getPublishedProducts({
      search,
      categorySlug,
      minPrice,
      maxPrice,
      inStock,
      featured,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        products: result.products,
        pagination: result.pagination,
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
