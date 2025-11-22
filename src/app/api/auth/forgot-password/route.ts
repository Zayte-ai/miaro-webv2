import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // In a real implementation, this would:
    // 1. Check if the email exists in the database
    // 2. Generate a password reset token
    // 3. Store the token in the database with an expiry time
    // 4. Send an email with a reset link containing the token

    // For demonstration purposes, we'll just simulate success
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
