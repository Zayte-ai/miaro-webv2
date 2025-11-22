import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, AdminAuthError } from '@/lib/admin-auth';

const productIncludes = {
  category: true,
  images: {
    orderBy: { sortOrder: 'asc' },
  },
  inventory: true,
  variants: {
    include: {
      inventory: true,
      variantOptions: {
        include: { option: true },
      },
    },
  },
} as const;

function buildProductResponse(product: any) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    comparePrice: product.comparePrice,
    costPrice: product.costPrice,
    category: product.category,
    images: product.images,
    inventory: product.inventory,
    variants: product.variants,
    trackInventory: product.trackInventory,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    publishedAt: product.publishedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function handleError(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
  }

  const prismaError = error as { code?: string } | null | undefined;
  if (prismaError?.code === 'P2025') {
    return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
  }

  console.error('[ADMIN_PRODUCT_API]', error);
  return NextResponse.json({ success: false, message: 'Unexpected server error' }, { status: 500 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: productIncludes,
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: buildProductResponse(product) });
  } catch (error) {
    return handleError(error);
  }
}

interface UpdateProductPayload {
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  sku?: string | null;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  trackInventory?: boolean;
  model3d?: string | null;
  imageFrames?: number | null;
  images?: Array<{ url: string; altText?: string | null; sortOrder?: number }>;
  inventory?: {
    quantity?: number;
    adjustBy?: number;
    lowStockThreshold?: number;
    allowBackorder?: boolean;
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const payload = (await request.json()) as UpdateProductPayload;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { inventory: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (payload.name !== undefined) {
      updateData.name = payload.name.trim();
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description.trim();
    }
    if (payload.shortDescription !== undefined) {
      updateData.shortDescription = payload.shortDescription.trim();
    }
    if (payload.price !== undefined) {
      if (typeof payload.price !== 'number' || Number.isNaN(payload.price)) {
        return NextResponse.json({ success: false, message: 'Price must be a valid number' }, { status: 400 });
      }
      updateData.price = payload.price;
    }
    if (payload.comparePrice !== undefined) {
      updateData.comparePrice = payload.comparePrice;
    }
    if (payload.costPrice !== undefined) {
      updateData.costPrice = payload.costPrice;
    }
    if (payload.sku !== undefined) {
      updateData.sku = payload.sku?.trim() ?? null;
    }
    if (payload.categoryId !== undefined) {
      updateData.categoryId = payload.categoryId;
    }
    if (payload.isActive !== undefined) {
      updateData.isActive = payload.isActive;
    }
    if (payload.isFeatured !== undefined) {
      updateData.isFeatured = payload.isFeatured;
    }
    if (payload.trackInventory !== undefined) {
      updateData.trackInventory = payload.trackInventory;
    }
    if (payload.model3d !== undefined) {
      updateData.model3d = payload.model3d;
    }
    if (payload.imageFrames !== undefined) {
      updateData.imageFrames = payload.imageFrames;
    }

    if (payload.slug && payload.slug.trim() && payload.slug.trim() !== existing.slug) {
      const baseSlug = payload.slug.trim();
      let candidate = baseSlug;
      let suffix = 1;
      while (await prisma.product.findUnique({ where: { slug: candidate } })) {
        candidate = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
      updateData.slug = candidate;
    }

  const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: updateData,
        include: productIncludes,
      });

      if (payload.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (payload.images.length > 0) {
          await tx.productImage.createMany({
            data: payload.images.map((image, index) => ({
              productId: id,
              url: image.url,
              altText: image.altText ?? null,
              sortOrder: image.sortOrder ?? index,
            })),
          });
        }
      }

      if (payload.inventory) {
        const inventory = await tx.productInventory.findUnique({ where: { productId: id } });
        const incomingQuantity = payload.inventory.quantity;
        const adjustBy = payload.inventory.adjustBy;
        const nextQuantity =
          typeof incomingQuantity === 'number'
            ? incomingQuantity
            : adjustBy !== undefined
            ? (inventory?.quantity ?? 0) + adjustBy
            : undefined;

        if (nextQuantity !== undefined && nextQuantity < 0) {
          throw new Error('Inventory quantity cannot be negative');
        }

        if (inventory) {
          await tx.productInventory.update({
            where: { productId: id },
            data: {
              quantity: nextQuantity ?? inventory.quantity,
              lowStockThreshold:
                payload.inventory.lowStockThreshold ?? inventory.lowStockThreshold,
              allowBackorder: payload.inventory.allowBackorder ?? inventory.allowBackorder,
            },
          });
        } else {
          await tx.productInventory.create({
            data: {
              productId: id,
              quantity: nextQuantity ?? 0,
              lowStockThreshold: payload.inventory.lowStockThreshold ?? 10,
              allowBackorder: payload.inventory.allowBackorder ?? false,
            },
          });
        }
      }

      return updated;
    });

    return NextResponse.json({ success: true, data: buildProductResponse(result) });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Inventory quantity cannot be negative')) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}
