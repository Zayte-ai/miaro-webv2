import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId?.trim()) {
      return NextResponse.json(
        { error: 'No sessionId provided' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({ status: session.status, session });
  } catch (error) {
    console.error('Error retrieving session status:', error);
    return NextResponse.json(
      { error: 'Error retrieving session status' },
      { status: 500 }
    );
  }
}