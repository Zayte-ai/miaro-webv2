/**
 * FedEx Shipping API Integration
 * Handles rate quotes, label generation, and tracking
 */

import axios from 'axios';

// FedEx API Configuration
const FEDEX_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://apis.fedex.com'
  : 'https://apis-sandbox.fedex.com';

const FEDEX_CONFIG = {
  apiKey: process.env.FEDEX_API_KEY || '',
  secretKey: process.env.FEDEX_SECRET_KEY || '',
  accountNumber: process.env.FEDEX_ACCOUNT_NUMBER || '',
  meterNumber: process.env.FEDEX_METER_NUMBER || '',
};

// Store address configuration
const WAREHOUSE_ADDRESS = {
  streetLines: [process.env.WAREHOUSE_ADDRESS_LINE1 || '123 Main St'],
  city: process.env.WAREHOUSE_CITY || 'Los Angeles',
  stateOrProvinceCode: process.env.WAREHOUSE_STATE || 'CA',
  postalCode: process.env.WAREHOUSE_ZIP || '90001',
  countryCode: 'US',
  contactPersonName: process.env.WAREHOUSE_CONTACT_NAME || 'MaisonMiaro Warehouse',
  phoneNumber: process.env.WAREHOUSE_PHONE || '1234567890',
};

// Types
export interface Address {
  streetLines: string[];
  city: string;
  stateOrProvinceCode: string;
  postalCode: string;
  countryCode: string;
  contactPersonName?: string;
  phoneNumber?: string;
  companyName?: string;
}

export interface PackageDetails {
  weight: number; // in pounds
  length?: number; // in inches
  width?: number; // in inches
  height?: number; // in inches
  declaredValue?: number; // in USD
}

export interface ShippingRate {
  serviceType: string;
  serviceName: string;
  totalCharge: number;
  currency: string;
  deliveryDate: string;
  deliveryDays: number;
  transitTime: string;
}

export interface ShipmentLabel {
  trackingNumber: string;
  labelImage: string; // Base64 encoded
  labelFormat: string;
  masterTrackingNumber?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  statusDescription: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: TrackingEvent[];
  currentLocation?: string;
}

export interface TrackingEvent {
  timestamp: string;
  eventType: string;
  eventDescription: string;
  location: string;
  city?: string;
  state?: string;
  country?: string;
}

/**
 * Get OAuth token for FedEx API
 */
async function getAccessToken(): Promise<string> {
  try {
    const response = await axios.post(
      `${FEDEX_API_URL}/oauth/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: FEDEX_CONFIG.apiKey,
        client_secret: FEDEX_CONFIG.secretKey,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('FedEx OAuth Error:', error);
    throw new Error('Failed to authenticate with FedEx API');
  }
}

/**
 * Get shipping rates for a destination
 */
export async function getShippingRates(
  destinationAddress: Address,
  packageDetails: PackageDetails
): Promise<ShippingRate[]> {
  try {
    const token = await getAccessToken();

    const requestBody = {
      accountNumber: {
        value: FEDEX_CONFIG.accountNumber,
      },
      requestedShipment: {
        shipper: {
          address: WAREHOUSE_ADDRESS,
        },
        recipient: {
          address: destinationAddress,
        },
        pickupType: 'USE_SCHEDULED_PICKUP',
        serviceType: 'FEDEX_GROUND', // Will try multiple services
        packagingType: 'YOUR_PACKAGING',
        rateRequestType: ['ACCOUNT', 'LIST'],
        requestedPackageLineItems: [
          {
            weight: {
              units: 'LB',
              value: packageDetails.weight,
            },
            dimensions: packageDetails.length ? {
              length: packageDetails.length,
              width: packageDetails.width,
              height: packageDetails.height,
              units: 'IN',
            } : undefined,
          },
        ],
      },
    };

    const response = await axios.post(
      `${FEDEX_API_URL}/rate/v1/rates/quotes`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-locale': 'en_US',
        },
      }
    );

    // Parse and format rates
    const rates: ShippingRate[] = [];
    const rateReplyDetails = response.data.output.rateReplyDetails || [];

    for (const detail of rateReplyDetails) {
      const serviceType = detail.serviceType;
      const serviceName = getServiceName(serviceType);
      const ratedShipmentDetails = detail.ratedShipmentDetails?.[0];

      if (ratedShipmentDetails) {
        rates.push({
          serviceType,
          serviceName,
          totalCharge: ratedShipmentDetails.totalNetCharge || 0,
          currency: ratedShipmentDetails.currency || 'USD',
          deliveryDate: detail.commit?.dateDetail?.dayFormat || '',
          deliveryDays: detail.commit?.dateDetail?.transitDays || 0,
          transitTime: detail.commit?.label || '',
        });
      }
    }

    return rates.sort((a, b) => a.totalCharge - b.totalCharge);
  } catch (error: any) {
    console.error('FedEx Rate Quote Error:', error.response?.data || error);
    throw new Error('Failed to get shipping rates');
  }
}

/**
 * Create shipping label
 */
export async function createShippingLabel(
  orderId: string,
  destinationAddress: Address,
  packageDetails: PackageDetails,
  serviceType: string = 'FEDEX_GROUND'
): Promise<ShipmentLabel> {
  try {
    const token = await getAccessToken();

    const requestBody = {
      accountNumber: {
        value: FEDEX_CONFIG.accountNumber,
      },
      requestedShipment: {
        shipper: {
          contact: {
            personName: WAREHOUSE_ADDRESS.contactPersonName,
            phoneNumber: WAREHOUSE_ADDRESS.phoneNumber,
          },
          address: WAREHOUSE_ADDRESS,
        },
        recipients: [
          {
            contact: {
              personName: destinationAddress.contactPersonName || 'Customer',
              phoneNumber: destinationAddress.phoneNumber || '',
            },
            address: destinationAddress,
          },
        ],
        shipDatestamp: new Date().toISOString().split('T')[0],
        serviceType,
        packagingType: 'YOUR_PACKAGING',
        pickupType: 'USE_SCHEDULED_PICKUP',
        blockInsightVisibility: false,
        shippingChargesPayment: {
          paymentType: 'SENDER',
        },
        labelSpecification: {
          imageType: 'PDF',
          labelStockType: 'PAPER_4X6',
        },
        requestedPackageLineItems: [
          {
            weight: {
              units: 'LB',
              value: packageDetails.weight,
            },
            dimensions: packageDetails.length ? {
              length: packageDetails.length,
              width: packageDetails.width,
              height: packageDetails.height,
              units: 'IN',
            } : undefined,
            customerReferences: [
              {
                customerReferenceType: 'CUSTOMER_REFERENCE',
                value: orderId,
              },
            ],
          },
        ],
      },
      labelResponseOptions: 'LABEL',
    };

    const response = await axios.post(
      `${FEDEX_API_URL}/ship/v1/shipments`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-locale': 'en_US',
        },
      }
    );

    const shipmentOutput = response.data.output.transactionShipments[0];
    const pieceResponses = shipmentOutput.pieceResponses[0];

    return {
      trackingNumber: pieceResponses.trackingNumber,
      labelImage: pieceResponses.packageDocuments[0].encodedLabel,
      labelFormat: 'PDF',
      masterTrackingNumber: shipmentOutput.masterTrackingNumber,
    };
  } catch (error: any) {
    console.error('FedEx Label Creation Error:', error.response?.data || error);
    throw new Error('Failed to create shipping label');
  }
}

/**
 * Track shipment by tracking number
 */
export async function trackShipment(trackingNumber: string): Promise<TrackingInfo> {
  try {
    const token = await getAccessToken();

    const requestBody = {
      includeDetailedScans: true,
      trackingInfo: [
        {
          trackingNumberInfo: {
            trackingNumber,
          },
        },
      ],
    };

    const response = await axios.post(
      `${FEDEX_API_URL}/track/v1/trackingnumbers`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-locale': 'en_US',
        },
      }
    );

    const trackData = response.data.output.completeTrackResults[0].trackResults[0];

    // Parse events
    const events: TrackingEvent[] = (trackData.scanEvents || []).map((event: any) => ({
      timestamp: event.date,
      eventType: event.eventType,
      eventDescription: event.eventDescription,
      location: `${event.scanLocation?.city || ''}, ${event.scanLocation?.stateOrProvinceCode || ''}`,
      city: event.scanLocation?.city,
      state: event.scanLocation?.stateOrProvinceCode,
      country: event.scanLocation?.countryCode,
    }));

    return {
      trackingNumber,
      status: trackData.latestStatusDetail?.code || 'UNKNOWN',
      statusDescription: trackData.latestStatusDetail?.description || 'Status unavailable',
      estimatedDelivery: trackData.estimatedDeliveryTimeWindow?.window?.ends,
      actualDelivery: trackData.actualDeliveryTimestamp,
      events,
      currentLocation: events[0]?.location,
    };
  } catch (error: any) {
    console.error('FedEx Tracking Error:', error.response?.data || error);
    throw new Error('Failed to track shipment');
  }
}

/**
 * Track multiple shipments
 */
export async function trackMultipleShipments(trackingNumbers: string[]): Promise<TrackingInfo[]> {
  const results = await Promise.allSettled(
    trackingNumbers.map(num => trackShipment(num))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<TrackingInfo> => result.status === 'fulfilled')
    .map(result => result.value);
}

/**
 * Cancel a shipment
 */
export async function cancelShipment(trackingNumber: string): Promise<boolean> {
  try {
    const token = await getAccessToken();

    const requestBody = {
      accountNumber: {
        value: FEDEX_CONFIG.accountNumber,
      },
      trackingNumber,
      deletionControl: 'DELETE_ALL_PACKAGES',
    };

    await axios.put(
      `${FEDEX_API_URL}/ship/v1/shipments/cancel`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-locale': 'en_US',
        },
      }
    );

    return true;
  } catch (error: any) {
    console.error('FedEx Cancel Shipment Error:', error.response?.data || error);
    return false;
  }
}

/**
 * Helper: Get friendly service name
 */
function getServiceName(serviceType: string): string {
  const serviceNames: Record<string, string> = {
    'FEDEX_GROUND': 'FedEx Ground (5-7 business days)',
    'FEDEX_EXPRESS_SAVER': 'FedEx Express Saver (3 business days)',
    'FEDEX_2_DAY': 'FedEx 2Day (2 business days)',
    'FEDEX_2_DAY_AM': 'FedEx 2Day A.M. (2 business days)',
    'STANDARD_OVERNIGHT': 'FedEx Standard Overnight (Next business day)',
    'PRIORITY_OVERNIGHT': 'FedEx Priority Overnight (Next business day by 10:30 AM)',
    'FIRST_OVERNIGHT': 'FedEx First Overnight (Next business day by 8 AM)',
  };

  return serviceNames[serviceType] || serviceType;
}

/**
 * Helper: Calculate package weight from order items
 */
export function calculatePackageWeight(items: Array<{ weight?: number; quantity: number }>): number {
  const totalWeight = items.reduce((sum, item) => {
    const itemWeight = item.weight || 0.5; // Default 0.5 lbs if not specified
    return sum + (itemWeight * item.quantity);
  }, 0);

  // Add packaging weight (0.5 lbs)
  return totalWeight + 0.5;
}

/**
 * Helper: Validate address
 */
export function validateAddress(address: Partial<Address>): address is Address {
  return !!(
    address.streetLines &&
    address.city &&
    address.stateOrProvinceCode &&
    address.postalCode &&
    address.countryCode
  );
}
