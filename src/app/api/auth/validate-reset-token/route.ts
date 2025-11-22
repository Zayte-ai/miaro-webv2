import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the token from the query string
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  // In a real implementation, this would validate the token in the database
  // For demonstration purposes, we'll just simulate a valid token
  const isValidToken = token && token.length > 10;

  return NextResponse.json({
    success: isValidToken,
    message: isValidToken
      ? 'Valid reset token'
      : 'Invalid or expired token',
  });
}
