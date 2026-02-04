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

function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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
  if (prismaError && prismaError.code === 'P2002') {
    return NextResponse.json({ success: false, message: 'Duplicate value detected' }, { status: 409 });
  }

  const err = error as any;
  console.error('[ADMIN_PRODUCTS_API]', err);

  const responseBody: any = { success: false, message: 'Unexpected server error' };
  if (err && err.message) {
    responseBody.message = err.message;
  }

  // In development include the error name and stack to help debugging (do not expose in production).
  if (process.env.NODE_ENV !== 'production') {
    responseBody.debug = {
      name: err?.name,
      stack: err?.stack,
    };
  }

  return NextResponse.json(responseBody, { status: 500 });
}

// GET /api/admin/products
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const products = await prisma.product.findMany({
      include: productIncludes,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: products.map(buildProductResponse),
      total: products.length,
    });
  } catch (error) {
    return handleError(error);
  }
}

interface CreateProductPayload {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  sku?: string | null;
  categoryId: string;
  isActive?: boolean;
  isFeatured?: boolean;
  trackInventory?: boolean;
  initialStock?: number;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
  images?: Array<{ url: string; altText?: string | null; sortOrder?: number }>;
  model3d?: string | null;
  imageFrames?: number | null;
  variants?: Array<{
    name: string;
    sku?: string;
    price?: number;
    comparePrice?: number;
    options: {
      [optionName: string]: string;
    };
  }>;
}

// POST /api/admin/products
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const payload = (await request.json()) as CreateProductPayload;

    if (!payload.name?.trim() || !payload.description?.trim() || !payload.categoryId) {
      return NextResponse.json(
        { success: false, message: 'Name, description, and category are required' },
        { status: 400 },
      );
    }

    if (typeof payload.price !== 'number' || Number.isNaN(payload.price)) {
      return NextResponse.json(
        { success: false, message: 'A valid price is required' },
        { status: 400 },
      );
    }

    const baseSlug = payload.slug?.trim() || generateSlug(payload.name);
    let slug = baseSlug;
    let suffix = 1;

    // Ensure unique slug
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const trackInventory = payload.trackInventory ?? true;
    const initialStock = payload.initialStock ?? 0;
    const lowStockThreshold = payload.lowStockThreshold ?? 10;
    const allowBackorder = payload.allowBackorder ?? false;

    // Pre-process variants to create options/values first
    const variantData: any[] = [];
    if (payload.variants && payload.variants.length > 0) {
      for (const variant of payload.variants) {
        const variantOptions: any[] = [];
        for (const [optionName, value] of Object.entries(variant.options)) {
          // Determine option type based on name
          let optionType = 'OTHER';
          const lowerName = optionName.toLowerCase();
          if (lowerName.includes('size')) optionType = 'SIZE';
          else if (lowerName.includes('color')) optionType = 'COLOR';
          else if (lowerName.includes('material')) optionType = 'MATERIAL';
          else if (lowerName.includes('style')) optionType = 'STYLE';

          // Get or create option
          let option = await prisma.option.findUnique({
            where: { name: optionName },
          });
          if (!option) {
            option = await prisma.option.create({
              data: { name: optionName, type: optionType as any },
            });
          }

          // Get or create option value (kept for reference/labels)
          let optionValue = await prisma.optionValue.findFirst({
            where: {
              optionId: option.id,
              value: value as string,
            },
          });
          if (!optionValue) {
            optionValue = await prisma.optionValue.create({
              data: {
                optionId: option.id,
                value: value as string,
              },
            });
          }

          // The VariantOption model stores `optionId` and `value` (not an `optionValueId`).
          // Create the nested variant option using the option id and the raw value string.
          variantOptions.push({
            optionId: option.id,
            value: value as string,
          });
        }

        variantData.push({
          name: variant.name,
          sku: variant.sku ?? null,
          price: variant.price ?? payload.price,
          comparePrice: variant.comparePrice ?? payload.comparePrice ?? null,
          variantOptions: {
            create: variantOptions,
          },
          inventory: trackInventory
            ? {
                create: {
                  quantity: initialStock,
                  lowStockThreshold,
                  allowBackorder,
                },
              }
            : undefined,
        });
      }
    }

    const product = await prisma.product.create({
      data: {
        name: payload.name.trim(),
        slug,
        description: payload.description.trim(),
        shortDescription: payload.shortDescription?.trim() ?? null,
        price: payload.price,
        comparePrice: payload.comparePrice ?? null,
        costPrice: payload.costPrice ?? null,
        sku: payload.sku?.trim() ?? null,
        categoryId: payload.categoryId,
        isActive: payload.isActive ?? true,
        isFeatured: payload.isFeatured ?? false,
        trackInventory,
        model3d: payload.model3d ?? null,
        imageFrames: payload.imageFrames ?? 35,
        publishedAt: new Date(),
        images:
          payload.images && payload.images.length > 0
            ? {
                create: payload.images.map((image, index) => ({
                  url: image.url,
                  altText: image.altText ?? null,
                  sortOrder: image.sortOrder ?? index,
                })),
              }
            : undefined,
        inventory: trackInventory
          ? {
              create: {
                quantity: initialStock,
                lowStockThreshold,
                allowBackorder,
              },
            }
          : undefined,
        variants: variantData.length > 0 ? { create: variantData } : undefined,
      },
      include: productIncludes,
    });

    return NextResponse.json({ success: true, data: buildProductResponse(product) });
  } catch (error) {
    return handleError(error);
  }
}
