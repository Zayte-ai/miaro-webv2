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
  if (prismaError?.code === 'P2025') {
    return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
  }

  console.error('[ADMIN_CATEGORY_API]', error);
  return NextResponse.json({ success: false, message: 'Unexpected server error' }, { status: 500 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const payload = (await request.json()) as {
      name?: string;
      slug?: string;
      description?: string | null;
      image?: string | null;
      parentId?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    };

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (payload.name !== undefined) {
      updateData.name = payload.name.trim();
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description?.trim() ?? null;
    }
    if (payload.image !== undefined) {
      updateData.image = payload.image ?? null;
    }
    if (payload.parentId !== undefined) {
      updateData.parentId = payload.parentId ?? null;
    }
    if (payload.sortOrder !== undefined) {
      updateData.sortOrder = payload.sortOrder;
    }
    if (payload.isActive !== undefined) {
      updateData.isActive = payload.isActive;
    }

    if (payload.slug && payload.slug.trim() && payload.slug.trim() !== existing.slug) {
      const baseSlug = slugify(payload.slug);
      let slug = baseSlug;
      let suffix = 1;
      while (await prisma.category.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
      updateData.slug = slug;
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete category while it has associated products',
        },
        { status: 409 },
      );
    }

  await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}