import { NextRequest, NextResponse } from 'next/server';
import { getShippingRates, calculatePackageWeight, type Address } from '@/lib/fedex';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, items } = body;

    // Validate required fields
    if (!address || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: address and items' },
        { status: 400 }
      );
    }

    // Convert address to FedEx format
    const fedexAddress: Address = {
      streetLines: [address.street, address.street2].filter(Boolean),
      city: address.city,
      stateOrProvinceCode: address.state,
      postalCode: address.zipCode,
      countryCode: address.country || 'US',
      contactPersonName: `${address.firstName} ${address.lastName}`,
      phoneNumber: address.phone,
    };

    // Calculate package weight
    const weight = calculatePackageWeight(items);

    // Get shipping rates from FedEx
    const rates = await getShippingRates(fedexAddress, {
      weight,
      // Optional: Add dimensions if products have them
      length: 12,
      width: 10,
      height: 8,
    });

    return NextResponse.json({
      success: true,
      data: {
        rates,
        packageWeight: weight,
      },
    });
  } catch (error: any) {
    console.error('Shipping rates API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get shipping rates',
      },
      { status: 500 }
    );
  }
}
