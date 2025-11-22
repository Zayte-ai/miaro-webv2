import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, AdminAuthError } from '@/lib/admin-auth';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function handleError(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
  }

  const prismaError = error as { code?: string } | null | undefined;
  if (prismaError?.code === 'P2002') {
    return NextResponse.json({ success: false, message: 'A category with this slug already exists' }, { status: 409 });
  }

  console.error('[ADMIN_CATEGORIES_API]', error);
  return NextResponse.json({ success: false, message: 'Unexpected server error' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return handleError(error);
  }
}

interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const payload = (await request.json()) as CreateCategoryPayload;

    if (!payload.name?.trim()) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const baseSlug = payload.slug?.trim() || slugify(payload.name);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const category = await prisma.category.create({
      data: {
        name: payload.name.trim(),
        slug,
        description: payload.description?.trim() ?? null,
        image: payload.image ?? null,
        parentId: payload.parentId ?? null,
        sortOrder: payload.sortOrder ?? 0,
        isActive: payload.isActive ?? true,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    return handleError(error);
  }
}