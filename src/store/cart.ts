import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartItem, Product, Size, Color } from '@/types';

interface CartStore {
  cart: Cart;
  addItem: (product: Product, size: Size, color: Color, quantity?: number) => void;
  removeItem: (productId: string, sizeId: string, colorId: string) => void;
  updateQuantity: (productId: string, sizeId: string, colorId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
}

const initialCart: Cart = {
  items: [],
  total: 0,
  itemCount: 0,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: initialCart,

      addItem: (product: Product, size: Size, color: Color, quantity = 1) => {
        set((state) => {
          const existingItemIndex = state.cart.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.selectedSize.id === size.id &&
              item.selectedColor.id === color.id
          );

          let updatedItems;
          if (existingItemIndex > -1) {
            // Update existing item quantity
            updatedItems = state.cart.items.map((item, index) =>
              index === existingItemIndex
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            // Add new item
            const newItem: CartItem = {
              product,
              quantity,
              selectedSize: size,
              selectedColor: color,
            };
            updatedItems = [...state.cart.items, newItem];
          }

          const total = updatedItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );
          const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

          return {
            cart: {
              items: updatedItems,
              total,
              itemCount,
            },
          };
        });
      },

      removeItem: (productId: string, sizeId: string, colorId: string) => {
        set((state) => {
          const updatedItems = state.cart.items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.selectedSize.id === sizeId &&
                item.selectedColor.id === colorId
              )
          );

          const total = updatedItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );
          const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

          return {
            cart: {
              items: updatedItems,
              total,
              itemCount,
            },
          };
        });
      },

      updateQuantity: (productId: string, sizeId: string, colorId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId, sizeId, colorId);
          return;
        }

        set((state) => {
          const updatedItems = state.cart.items.map((item) =>
            item.product.id === productId &&
            item.selectedSize.id === sizeId &&
            item.selectedColor.id === colorId
              ? { ...item, quantity }
              : item
          );

          const total = updatedItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
          );
          const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

          return {
            cart: {
              items: updatedItems,
              total,
              itemCount,
            },
          };
        });
      },

      clearCart: () => {
        set({ cart: initialCart });
      },

      getItemCount: () => {
        return get().cart.itemCount;
      },

      getTotal: () => {
        return get().cart.total;
      },
    }),
    {
      name: 'maisonmiaro-cart',
    }
  )
);
