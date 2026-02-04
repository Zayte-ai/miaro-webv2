import prisma from './db';
import { Prisma } from '@prisma/client';

export type ProductFilters = {
  search?: string;
  categorySlug?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  limit?: number;
};

/**
 * Fetch all published, active products with filters
 */
export async function getPublishedProducts(filters: ProductFilters = {}) {
  const {
    search,
    categorySlug,
    featured = false,
    minPrice,
    maxPrice,
    inStock,
    page = 1,
    limit = 12,
  } = filters;

  // Validate limit
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const skip = (page - 1) * safeLimit;

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    publishedAt: { not: null }, // Only published products
  };

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { shortDescription: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Category filter
  if (categorySlug) {
    where.category = {
      slug: categorySlug,
      isActive: true,
    };
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Stock filter
  if (inStock) {
    where.inventory = {
      quantity: { gt: 0 },
    };
  }

  // Featured filter
  if (featured) {
    where.isFeatured = true;
  }

  // Fetch products
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        inventory: {
          select: {
            quantity: true,
            lowStockThreshold: true,
          },
        },
        variants: {
          where: { isActive: true },
          include: {
            variantOptions: { 
              include: { 
                option: {
                  include: {
                    values: true
                  }
                }
              } 
            },
            inventory: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: safeLimit,
      skip,
    }),
    prisma.product.count({ where }),
  ]);

  // Normalize each product to include sizes/colors and normalized variants
  const normalize = (product: any) => {
    const sizesMap = new Map();
    const colorsMap = new Map();
    const normalizedVariants = (product.variants || []).map((v: any) => {
      let size = null;
      let color = null;
      for (const vo of v.variantOptions || []) {
        const optName = vo.option?.name || '';
        const optType = vo.option?.type || '';
        const val = vo.value;
        const compositeId = `${vo.optionId}:${val}`;
        if (optType === 'SIZE' || /size/i.test(optName)) {
          size = { id: compositeId, name: val, value: val };
          sizesMap.set(compositeId, size);
        } else if (optType === 'COLOR' || /color/i.test(optName)) {
          // Find the hexCode from the option's values
          const optionValue = vo.option?.values?.find((ov: any) => ov.value === val);
          const hex = optionValue?.hexCode || '#000000';
          color = { id: compositeId, name: val, hex };
          colorsMap.set(compositeId, color);
        }
      }

      return {
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        price: v.price ?? product.price,
        salePrice: v.comparePrice ?? undefined,
        size,
        color,
        stock: v.inventory?.quantity ?? 0,
        isActive: v.isActive,
      };
    });

    return {
      ...product,
      sizes: Array.from(sizesMap.values()),
      colors: Array.from(colorsMap.values()),
      variants: normalizedVariants,
    };
  };

  const normalizedProducts = products.map(normalize);

  return {
    products: normalizedProducts,
    pagination: {
      total,
      page,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
      hasNextPage: page < Math.ceil(total / safeLimit),
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Get a single product by ID with all relations
 */
export async function getPublishedProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      variants: {
        where: { isActive: true },
        include: {
          variantOptions: {
            include: {
              option: {
                include: {
                  values: true
                }
              },
            },
          },
          inventory: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
      inventory: true,
      reviews: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });

  // Only return if published and active
  if (!product || !product.isActive || !product.publishedAt) {
    return null;
  }

  // Transform product to include explicit sizes, colors and normalized variants
  const sizesMap = new Map<string, { id: string; name: string; value: string }>();
  const colorsMap = new Map<string, { id: string; name: string; hex: string }>();

  const normalizedVariants = (product.variants || []).map((v: any) => {
    let size = null;
    let color = null;
    for (const vo of v.variantOptions || []) {
      const optName = vo.option?.name || '';
      const optType = vo.option?.type || '';
      const val = vo.value;
      const compositeId = `${vo.optionId}:${val}`;
      if (optType === 'SIZE' || /size/i.test(optName)) {
        size = { id: compositeId, name: val, value: val };
        sizesMap.set(compositeId, size);
      } else if (optType === 'COLOR' || /color/i.test(optName)) {
        // Find the hexCode from the option's values
        const optionValue = vo.option?.values?.find((ov: any) => ov.value === val);
        const hex = optionValue?.hexCode || '#000000';
        color = { id: compositeId, name: val, hex };
        colorsMap.set(compositeId, color);
      } else {
        // generic option, ignore for now
      }
    }

    return {
      id: v.id,
      productId: v.productId,
      sku: v.sku,
      price: v.price ?? product.price,
      salePrice: v.comparePrice ?? undefined,
      size,
      color,
      stock: v.inventory?.quantity ?? 0,
      isActive: v.isActive,
    };
  });

  const sizes = Array.from(sizesMap.values());
  const colors = Array.from(colorsMap.values());

  return {
    ...product,
    sizes,
    colors,
    variants: normalizedVariants,
  };
}

/**
 * Get product by slug instead of ID
 */
export async function getPublishedProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      variants: {
        where: { isActive: true },
        include: {
          variantOptions: {
            include: {
              option: {
                include: {
                  values: true
                }
              },
            },
          },
          inventory: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
      inventory: true,
      reviews: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
  });

  // Only return if published and active
  if (!product || !product.isActive || !product.publishedAt) {
    return null;
  }

  // Transform product similarly to getPublishedProductById
  const sizesMap = new Map<string, { id: string; name: string; value: string }>();
  const colorsMap = new Map<string, { id: string; name: string; hex: string }>();

  const normalizedVariants = (product.variants || []).map((v: any) => {
    let size = null;
    let color = null;
    for (const vo of v.variantOptions || []) {
      const optName = vo.option?.name || '';
      const optType = vo.option?.type || '';
      const val = vo.value;
      const compositeId = `${vo.optionId}:${val}`;
      if (optType === 'SIZE' || /size/i.test(optName)) {
        size = { id: compositeId, name: val, value: val };
        sizesMap.set(compositeId, size);
      } else if (optType === 'COLOR' || /color/i.test(optName)) {
        // Find the hexCode from the option's values
        const optionValue = vo.option?.values?.find((ov: any) => ov.value === val);
        const hex = optionValue?.hexCode || '#000000';
        color = { id: compositeId, name: val, hex };
        colorsMap.set(compositeId, color);
      }
    }

    return {
      id: v.id,
      productId: v.productId,
      sku: v.sku,
      price: v.price ?? product.price,
      salePrice: v.comparePrice ?? undefined,
      size,
      color,
      stock: v.inventory?.quantity ?? 0,
      isActive: v.isActive,
    };
  });

  const sizes = Array.from(sizesMap.values());
  const colors = Array.from(colorsMap.values());

  return {
    ...product,
    sizes,
    colors,
    variants: normalizedVariants,
  };
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit: number = 6) {
  return getPublishedProducts({
    featured: true,
    limit,
  });
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  categorySlug: string,
  limit: number = 12,
  page: number = 1
) {
  return getPublishedProducts({
    categorySlug,
    limit,
    page,
  });
}

/**
 * Get all categories
 */
export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
              publishedAt: { not: null },
            },
          },
        },
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });
}

/**
 * Search products
 */
export async function searchProducts(
  query: string,
  limit: number = 12,
  page: number = 1
) {
  return getPublishedProducts({
    search: query,
    limit,
    page,
  });
}
