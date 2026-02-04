import { NextRequest, NextResponse } from 'next/server';
import { getPublishedProductById, getPublishedProductBySlug } from '@/lib/prisma-products';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Try to fetch product by ID first, then by slug
    let product = await getPublishedProductById(id);

    // If not found by ID, try by slug
    if (!product) {
      product = await getPublishedProductBySlug(id);
    }

    // Product not found or not published
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        product,
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product',
      },
      { status: 500 }
    );
  }
}
