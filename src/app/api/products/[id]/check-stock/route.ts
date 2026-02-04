import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Check available stock for a product variant
 * POST /api/products/[id]/check-stock
 * 
 * Body: {
 *   sizeId?: string,
 *   colorId?: string,
 *   requestedQuantity: number
 * }
 * 
 * Returns: {
 *   available: boolean,
 *   availableStock: number,
 *   requestedQuantity: number,
 *   message?: string
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { sizeId, colorId, requestedQuantity } = await request.json();
    const productId = params.id;

    console.log('[STOCK CHECK]', { productId, sizeId, colorId, requestedQuantity });

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!requestedQuantity || requestedQuantity < 1) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    // Find the product with inventory and variants
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventory: true,
        variants: {
          include: {
            inventory: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    let availableStock = 0;
    let inventorySource = 'product';

    // If size is selected, check variant-level inventory
    if (sizeId && product.variants && product.variants.length > 0) {
      // Find the matching variant by comparing the variant name with the size value
      // sizeId format is "optionId:value" (e.g., "cmkt16xst0002wnj8awo48l64:M")
      const sizeValue = sizeId.split(':')[1];
      
      const matchingVariant = product.variants.find(v => v.name === sizeValue);
      
      if (matchingVariant) {
        availableStock = matchingVariant.inventory?.quantity ?? 0;
        inventorySource = 'variant';
        console.log('[STOCK CHECK] Using variant stock:', { variantName: matchingVariant.name, availableStock });
      } else {
        // Variant not found, use product-level inventory as fallback
        availableStock = product.inventory?.quantity ?? 0;
        console.log('[STOCK CHECK] Variant not found, using product stock:', availableStock);
      }
    } else {
      // No size selected, use product-level inventory
      availableStock = product.inventory?.quantity ?? 0;
      console.log('[STOCK CHECK] No size selected, using product stock:', availableStock);
    }

    const available = availableStock >= requestedQuantity;

    console.log('[STOCK CHECK] Result:', { availableStock, available, inventorySource });

    return NextResponse.json({
      available,
      availableStock,
      requestedQuantity,
      inventorySource,
      message: available
        ? 'Stock available'
        : `Only ${availableStock} item${availableStock !== 1 ? 's' : ''} available`,
    });
  } catch (error) {
    console.error('Stock check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check stock' },
      { status: 500 }
    );
  }
}
