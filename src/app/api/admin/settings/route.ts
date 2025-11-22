import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    // Fetch all settings
    const settings = await prisma.setting.findMany();

    // Convert to key-value object
    const settingsObject: Record<string, any> = {};
    settings.forEach((setting) => {
      let value: any = setting.value;

      // Parse based on type
      switch (setting.type) {
        case 'NUMBER':
          value = parseFloat(setting.value);
          break;
        case 'BOOLEAN':
          value = setting.value === 'true';
          break;
        case 'JSON':
          try {
            value = JSON.parse(setting.value);
          } catch (e) {
            value = setting.value;
          }
          break;
        default:
          value = setting.value;
      }

      settingsObject[setting.key] = value;
    });

    return NextResponse.json({ settings: settingsObject });
  } catch (error: any) {
    console.error('Error fetching settings:', error);

    if (error.name === 'AdminAuthError') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Update or create settings
    const updates = [];

    for (const [key, value] of Object.entries(settings)) {
      // Determine type
      let type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' = 'STRING';
      let stringValue: string;

      if (typeof value === 'number') {
        type = 'NUMBER';
        stringValue = value.toString();
      } else if (typeof value === 'boolean') {
        type = 'BOOLEAN';
        stringValue = value.toString();
      } else if (typeof value === 'object' && value !== null) {
        type = 'JSON';
        stringValue = JSON.stringify(value);
      } else {
        type = 'STRING';
        stringValue = String(value);
      }

      updates.push(
        prisma.setting.upsert({
          where: { key },
          create: {
            key,
            value: stringValue,
            type,
          },
          update: {
            value: stringValue,
            type,
          },
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving settings:', error);

    if (error.name === 'AdminAuthError') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
