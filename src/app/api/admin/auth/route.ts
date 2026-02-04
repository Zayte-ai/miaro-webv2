import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin as authenticateAdminWithDb } from '@/lib/auth';

// POST /api/admin/auth
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Missing credentials' }, { status: 400 });
    }

    const result = await authenticateAdminWithDb(email, password);

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    console.error('[ADMIN_AUTH_ROUTE] Error handling admin auth request', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
