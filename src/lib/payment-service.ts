import { API_CONFIG } from './api-config';
import { createPaymentIntent, createRefund } from './stripe';
import type Stripe from 'stripe';

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: Stripe.PaymentIntent.Status;
}

export interface PaymentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  error?: string;
  orderId?: string;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
}

export interface CreateOrderData {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  customerEmail: string;
  customerPhone?: string;
  shippingMethod: string;
  shippingCost: number;
  tax: number;
  subtotal: number;
  total: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'apple_pay' | 'google_pay';
}

export class PaymentService {
  // Stripe Payment Processing
  static async createStripePaymentIntent(orderData: CreateOrderData): Promise<PaymentResult> {
    try {
      const paymentIntent = await createPaymentIntent({
        amount: orderData.total,
        currency: orderData.currency,
        metadata: {
          customerEmail: orderData.customerEmail,
          orderItems: JSON.stringify(orderData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))),
        },
        paymentMethodId: undefined,
        customerId: undefined,
      });

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret!,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  static async confirmStripePayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/payments/stripe/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Payment confirmation failed' };
      }

      return {
        success: true,
        paymentIntent: data.paymentIntent,
        orderId: data.orderId,
      };
    } catch (error) {
      console.error('Stripe payment confirmation failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // PayPal Payment Processing
  static async createPayPalOrder(orderData: CreateOrderData): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: `order_${Date.now()}`,
            amount: {
              currency_code: orderData.currency.toUpperCase(),
              value: orderData.total.toString(),
              breakdown: {
                item_total: {
                  currency_code: orderData.currency.toUpperCase(),
                  value: orderData.subtotal.toString(),
                },
                shipping: {
                  currency_code: orderData.currency.toUpperCase(),
                  value: orderData.shippingCost.toString(),
                },
                tax_total: {
                  currency_code: orderData.currency.toUpperCase(),
                  value: orderData.tax.toString(),
                },
              },
            },
            items: orderData.items.map(item => ({
              name: item.name,
              unit_amount: {
                currency_code: orderData.currency.toUpperCase(),
                value: item.price.toString(),
              },
              quantity: item.quantity.toString(),
            })),
            shipping: {
              name: {
                full_name: orderData.shippingAddress.name,
              },
              address: {
                address_line_1: orderData.shippingAddress.line1,
                address_line_2: orderData.shippingAddress.line2,
                admin_area_2: orderData.shippingAddress.city,
                admin_area_1: orderData.shippingAddress.state,
                postal_code: orderData.shippingAddress.postal_code,
                country_code: orderData.shippingAddress.country,
              },
            },
          }],
          payer: {
            email_address: orderData.customerEmail,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create PayPal order' };
      }

      return {
        success: true,
        paymentIntent: {
          id: data.id,
          clientSecret: data.id,
          amount: orderData.total,
          currency: orderData.currency,
          status: 'requires_payment_method',
        },
      };
    } catch (error) {
      console.error('PayPal order creation failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  static async capturePayPalOrder(orderId: string): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/payments/paypal/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'PayPal capture failed' };
      }

      return {
        success: true,
        orderId: data.orderId,
      };
    } catch (error) {
      console.error('PayPal capture failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Refund Processing
  static async processRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/payments/stripe/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Refund failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Refund processing failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Tax Calculation
  static async calculateTax(orderData: Omit<CreateOrderData, 'tax'>): Promise<{ tax: number; error?: string }> {
    try {
      const response = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: orderData.subtotal + orderData.shippingCost,
          shipping: orderData.shippingCost,
          to_country: orderData.shippingAddress.country,
          to_state: orderData.shippingAddress.state,
          to_city: orderData.shippingAddress.city,
          to_zip: orderData.shippingAddress.postal_code,
          line_items: orderData.items.map(item => ({
            quantity: item.quantity,
            unit_price: item.price,
            product_tax_code: '20010', // General clothing tax code
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { tax: 0, error: data.error || 'Tax calculation failed' };
      }

      return { tax: data.tax.amount_to_collect };
    } catch (error) {
      console.error('Tax calculation failed:', error);
      return { tax: 0, error: 'Network error occurred' };
    }
  }

  // Shipping Rate Calculation
  static async calculateShippingRates(
    items: OrderItem[],
    shippingAddress: ShippingAddress
  ): Promise<{ rates: ShippingRate[]; error?: string }> {
    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: shippingAddress,
          parcels: [{
            length: '10', // Default package dimensions
            width: '8',
            height: '4',
            distance_unit: 'in',
            weight: items.reduce((total, item) => total + (item.quantity * 0.5), 0), // Estimate weight
            mass_unit: 'lb',
          }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { rates: [], error: data.error || 'Shipping calculation failed' };
      }

      return { rates: data.rates };
    } catch (error) {
      console.error('Shipping calculation failed:', error);
      return { rates: [], error: 'Network error occurred' };
    }
  }
}

export interface ShippingRate {
  object_id: string;
  provider: string;
  servicelevel: {
    name: string;
    token: string;
    terms: string;
  };
  amount: string;
  currency: string;
  duration_terms: string;
  estimated_days: number;
}

// Order Management Service
export class OrderService {
  static async createOrder(orderData: CreateOrderData & { paymentIntentId: string }): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Order creation failed' };
      }

      return { success: true, orderId: data.orderId };
    } catch (error) {
      console.error('Order creation failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  static async updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, trackingNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Order update failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Order update failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  static async getOrder(orderId: string): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Order not found' };
      }

      return { success: true, order: data.order };
    } catch (error) {
      console.error('Order fetch failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }
}
