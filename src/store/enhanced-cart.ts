import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, Size, Color } from '@/types';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedSize: Size;
  selectedColor: Color;
  addedAt: Date;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface CartState {
  items: CartItem[];
  shippingAddress: ShippingAddress | null;
  billingAddress: ShippingAddress | null;
  shippingMethod: string | null;
  shippingCost: number;
  taxRate: number;
  discountCode: string | null;
  discountAmount: number;
}

export interface CartActions {
  // Item management
  addItem: (product: Product, size: Size, color: Color, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Address management
  setShippingAddress: (address: ShippingAddress) => void;
  setBillingAddress: (address: ShippingAddress) => void;
  
  // Shipping & discounts
  setShippingMethod: (method: string, cost: number) => void;
  applyDiscountCode: (code: string) => Promise<boolean>;
  removeDiscountCode: () => void;
  
  // Calculations
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  
  // Persistence
  saveToAccount: (userId: string) => Promise<void>;
  loadFromAccount: (userId: string) => Promise<void>;
  
  // Checkout preparation
  prepareCheckoutData: () => CheckoutData;
}

export interface CheckoutData {
  items: CartItem[];
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      shippingAddress: null,
      billingAddress: null,
      shippingMethod: null,
      shippingCost: 0,
      taxRate: 0.08, // 8% default tax rate
      discountCode: null,
      discountAmount: 0,

      // Item management
      addItem: (product, size, color, quantity = 1) => {
        set((state) => {
          // Check if item already exists with same variant
          const existingItemIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.selectedSize.id === size.id &&
              item.selectedColor.id === color.id
          );

          if (existingItemIndex >= 0) {
            // Update quantity of existing item
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += quantity;
            return { items: updatedItems };
          } else {
            // Add new item
            const newItem: CartItem = {
              id: `${product.id}-${size.id}-${color.id}-${Date.now()}`,
              product,
              quantity,
              selectedSize: size,
              selectedColor: color,
              addedAt: new Date(),
            };
            return { items: [...state.items, newItem] };
          }
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({
          items: [],
          shippingAddress: null,
          billingAddress: null,
          shippingMethod: null,
          shippingCost: 0,
          discountCode: null,
          discountAmount: 0,
        });
      },

      // Address management
      setShippingAddress: (address) => {
        set({ shippingAddress: address });
      },

      setBillingAddress: (address) => {
        set({ billingAddress: address });
      },

      // Shipping & discounts
      setShippingMethod: (method, cost) => {
        set({ shippingMethod: method, shippingCost: cost });
      },

      applyDiscountCode: async (code) => {
        try {
          const response = await fetch('/api/discounts/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              code, 
              cartTotal: get().getSubtotal(),
              items: get().items 
            }),
          });

          const data = await response.json();

          if (response.ok && data.valid) {
            set({
              discountCode: code,
              discountAmount: data.discountAmount,
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Error applying discount code:', error);
          return false;
        }
      },

      removeDiscountCode: () => {
        set({ discountCode: null, discountAmount: 0 });
      },

      // Calculations
      getSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          const price = item.product.salePrice || item.product.price;
          return total + price * item.quantity;
        }, 0);
      },

      getTax: () => {
        const { taxRate } = get();
        const subtotal = get().getSubtotal();
        const shippingCost = get().shippingCost;
        return (subtotal + shippingCost) * taxRate;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTax();
        const { shippingCost, discountAmount } = get();
        return Math.max(0, subtotal + tax + shippingCost - discountAmount);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      // Persistence
      saveToAccount: async (userId) => {
        try {
          const cartData = {
            items: get().items,
            shippingAddress: get().shippingAddress,
            billingAddress: get().billingAddress,
            discountCode: get().discountCode,
          };

          await fetch('/api/cart/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, cartData }),
          });
        } catch (error) {
          console.error('Error saving cart to account:', error);
        }
      },

      loadFromAccount: async (userId) => {
        try {
          const response = await fetch(`/api/cart/load?userId=${userId}`);
          if (response.ok) {
            const { cartData } = await response.json();
            set({
              items: cartData.items || [],
              shippingAddress: cartData.shippingAddress || null,
              billingAddress: cartData.billingAddress || null,
              discountCode: cartData.discountCode || null,
            });

            // Reapply discount if exists
            if (cartData.discountCode) {
              await get().applyDiscountCode(cartData.discountCode);
            }
          }
        } catch (error) {
          console.error('Error loading cart from account:', error);
        }
      },

      // Checkout preparation
      prepareCheckoutData: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        const tax = state.getTax();
        const total = state.getTotal();

        if (!state.shippingAddress || !state.billingAddress || !state.shippingMethod) {
          throw new Error('Missing required checkout information');
        }

        return {
          items: state.items,
          shippingAddress: state.shippingAddress,
          billingAddress: state.billingAddress,
          shippingMethod: state.shippingMethod,
          shippingCost: state.shippingCost,
          subtotal,
          tax,
          discount: state.discountAmount,
          total,
          currency: 'USD',
        };
      },
    }),
    {
      name: 'maisonmiaro-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        shippingAddress: state.shippingAddress,
        billingAddress: state.billingAddress,
        discountCode: state.discountCode,
      }),
    }
  )
);

// Helper functions for cart operations
export const calculateItemTotal = (item: CartItem): number => {
  const price = item.product.salePrice || item.product.price;
  return price * item.quantity;
};

export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getCartItemKey = (productId: string, sizeId: string, colorId: string): string => {
  return `${productId}-${sizeId}-${colorId}`;
};

// Cart validation functions
export const validateCartForCheckout = (cart: CartState): string[] => {
  const errors: string[] = [];

  if (cart.items.length === 0) {
    errors.push('Cart is empty');
  }

  if (!cart.shippingAddress) {
    errors.push('Shipping address is required');
  }

  if (!cart.billingAddress) {
    errors.push('Billing address is required');
  }

  if (!cart.shippingMethod) {
    errors.push('Shipping method is required');
  }

  // Validate individual items
  cart.items.forEach((item, index) => {
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity`);
    }
    
    if (!item.selectedSize) {
      errors.push(`Item ${index + 1}: Size is required`);
    }
    
    if (!item.selectedColor) {
      errors.push(`Item ${index + 1}: Color is required`);
    }
  });

  return errors;
};

// Abandoned cart recovery
export const trackAbandonedCart = () => {
  const cart = useCartStore.getState();
  
  if (cart.items.length > 0) {
    setTimeout(() => {
      // Send abandoned cart email after 24 hours
      fetch('/api/email/abandoned-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items,
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);
    }, 24 * 60 * 60 * 1000); // 24 hours
  }
};
