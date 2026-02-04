import { NextRequest } from 'next/server';
import { prisma } from './db';
import { verifyToken } from './auth';

export class AdminAuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AdminAuthError';
  }
}

function extractTokenFromRequest(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }

  const tokenFromCookie = request.cookies.get('admin_token');
  if (tokenFromCookie?.value) {
    return tokenFromCookie.value;
  }

  return null;
}

type PrismaAdmin = Awaited<ReturnType<typeof prisma.admin.findUnique>>;

export async function requireAdmin(
  request: NextRequest,
): Promise<NonNullable<PrismaAdmin>> {
  const token = extractTokenFromRequest(request);
  if (!token) {
    throw new AdminAuthError('Unauthorized', 401);
  }

  const payload = verifyToken(token);
  if (!payload?.userId || !payload.isAdmin) {
    throw new AdminAuthError('Invalid credentials', 401);
  }

  const admin = await prisma.admin.findUnique({ where: { id: payload.userId } });
  if (!admin || !admin.isActive) {
    throw new AdminAuthError('Admin account inactive', 403);
  }

  return admin;
}

/**
 * Vérifier un token admin sans faire de requête à la base de données
 * Utilisé pour des opérations simples
 */
export function verifyAdminToken(token: string): { userId: string; isAdmin: boolean } | null {
  try {
    const payload = verifyToken(token);
    if (!payload?.userId || !payload.isAdmin) {
      return null;
    }
    return { userId: payload.userId, isAdmin: payload.isAdmin };
  } catch {
    return null;
  }
}
