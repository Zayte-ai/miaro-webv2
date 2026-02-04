import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      jwtSecretDefined: !!process.env.JWT_SECRET,
      jwtSecret: process.env.JWT_SECRET ? '[REDACTED]' : null,
      adminEmail: process.env.ADMIN_EMAIL ?? null,
      adminPasswordDefined: !!process.env.ADMIN_PASSWORD,
      nodeEnv: process.env.NODE_ENV ?? null,
      databaseUrlDefined: !!process.env.DATABASE_URL,
      databaseUrlPreview: process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 80) + '...' : null,
    });
  } catch (error) {
    console.error('[DEBUG_ENV_ROUTE] error', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
