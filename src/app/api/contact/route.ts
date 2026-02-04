import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendContactEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// Validation schema
const contactSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(100),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = contactSchema.parse(body);

    // Save to database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        subject: validatedData.subject,
        message: validatedData.message,
      },
    });

    // Send email notification to jakob.legris17@gmail.com
    const emailResult = await sendContactEmail({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      subject: validatedData.subject,
      message: validatedData.message,
    });

    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      // Continue anyway - message is saved in database
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
        id: contactMessage.id,
        emailSent: emailResult.success,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit contact form. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve contact messages (admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const admin = await requireAdmin(request);

    const messages = await prisma.contactMessage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch contact messages',
      },
      { status: 500 }
    );
  }
}
