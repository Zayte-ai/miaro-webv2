import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const body = await request.json();
    const { productId, productVariantId, quantityChange, operation = 'set' } = body;

    // Validate input
    if (!productId && !productVariantId) {
      return NextResponse.json(
        { error: 'Either productId or productVariantId is required' },
        { status: 400 }
      );
    }

    if (quantityChange === undefined || typeof quantityChange !== 'number') {
      return NextResponse.json(
        { error: 'quantityChange must be a number' },
        { status: 400 }
      );
    }

    // Update product inventory
    if (productId && !productVariantId) {
      // Check if inventory exists
      let inventory = await prisma.productInventory.findUnique({
        where: { productId },
      });

      if (!inventory) {
        // Create inventory record if it doesn't exist
        inventory = await prisma.productInventory.create({
          data: {
            productId,
            quantity: operation === 'add' ? quantityChange : quantityChange,
            trackQuantity: true,
            allowBackorder: false,
            lowStockThreshold: 10,
          },
        });
      } else {
        // Update existing inventory
        const newQuantity =
          operation === 'add'
            ? inventory.quantity + quantityChange
            : operation === 'subtract'
            ? inventory.quantity - quantityChange
            : quantityChange;

        inventory = await prisma.productInventory.update({
          where: { productId },
          data: {
            quantity: Math.max(0, newQuantity), // Don't allow negative
          },
        });
      }

      return NextResponse.json({
        success: true,
        inventory,
      });
    }

    // Update product variant inventory
    if (productVariantId) {
      // Check if inventory exists
      let inventory = await prisma.productVariantInventory.findUnique({
        where: { productVariantId },
      });

      if (!inventory) {
        // Create inventory record if it doesn't exist
        inventory = await prisma.productVariantInventory.create({
          data: {
            productVariantId,
            quantity: operation === 'add' ? quantityChange : quantityChange,
            trackQuantity: true,
            allowBackorder: false,
            lowStockThreshold: 10,
          },
        });
      } else {
        // Update existing inventory
        const newQuantity =
          operation === 'add'
            ? inventory.quantity + quantityChange
            : operation === 'subtract'
            ? inventory.quantity - quantityChange
            : quantityChange;

        inventory = await prisma.productVariantInventory.update({
          where: { productVariantId },
          data: {
            quantity: Math.max(0, newQuantity), // Don't allow negative
          },
        });
      }

      return NextResponse.json({
        success: true,
        inventory,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating inventory:', error);

    if (error.name === 'AdminAuthError') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

// Bulk inventory update
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'updates must be an array' },
        { status: 400 }
      );
    }

    const results = [];

    for (const update of updates) {
      const { productId, productVariantId, quantityChange, operation = 'set' } = update;

      try {
        if (productId && !productVariantId) {
          let inventory = await prisma.productInventory.findUnique({
            where: { productId },
          });

          if (!inventory) {
            inventory = await prisma.productInventory.create({
              data: {
                productId,
                quantity: operation === 'add' ? quantityChange : quantityChange,
                trackQuantity: true,
                allowBackorder: false,
                lowStockThreshold: 10,
              },
            });
          } else {
            const newQuantity =
              operation === 'add'
                ? inventory.quantity + quantityChange
                : operation === 'subtract'
                ? inventory.quantity - quantityChange
                : quantityChange;

            inventory = await prisma.productInventory.update({
              where: { productId },
              data: {
                quantity: Math.max(0, newQuantity),
              },
            });
          }

          results.push({ success: true, productId, inventory });
        } else if (productVariantId) {
          let inventory = await prisma.productVariantInventory.findUnique({
            where: { productVariantId },
          });

          if (!inventory) {
            inventory = await prisma.productVariantInventory.create({
              data: {
                productVariantId,
                quantity: operation === 'add' ? quantityChange : quantityChange,
                trackQuantity: true,
                allowBackorder: false,
                lowStockThreshold: 10,
              },
            });
          } else {
            const newQuantity =
              operation === 'add'
                ? inventory.quantity + quantityChange
                : operation === 'subtract'
                ? inventory.quantity - quantityChange
                : quantityChange;

            inventory = await prisma.productVariantInventory.update({
              where: { productVariantId },
              data: {
                quantity: Math.max(0, newQuantity),
              },
            });
          }

          results.push({ success: true, productVariantId, inventory });
        }
      } catch (error) {
        results.push({
          success: false,
          productId: productId || productVariantId,
          error: 'Failed to update',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('Error bulk updating inventory:', error);

    if (error.name === 'AdminAuthError') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to bulk update inventory' },
      { status: 500 }
    );
  }
}
