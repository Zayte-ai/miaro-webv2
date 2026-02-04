import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartItem, Product, Size, Color } from '@/types';

interface CartStore {
  cart: Cart;
  addItem: (product: Product, size: Size | null, color: Color | null, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  removeItem: (productId: string, sizeId: string | null, colorId: string | null) => void;
  updateQuantity: (productId: string, sizeId: string | null, colorId: string | null, quantity: number) => Promise<{ success: boolean; error?: string }>;
  clearCart: () => void;
  getItemCount: () => number;
  getTotal: () => number;
  refreshPrices: () => Promise<void>;
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

      addItem: async (product: Product, size: Size | null, color: Color | null, quantity = 1) => {
        console.log('[CART] Adding item:', { 
          productId: product.id, 
          productName: product.name,
          size: size?.value, 
          color: color?.name, 
          quantity 
        });
        
        // Calculate current quantity in cart for this product/size/color combination
        const currentCart = get().cart;
        const existingItem = currentCart.items.find(
          (item) =>
            item.product.id === product.id &&
            item.selectedSize?.id === size?.id &&
            item.selectedColor?.id === color?.id
        );
        
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        const totalRequestedQuantity = currentQuantity + quantity;

        console.log('[CART] Current quantity in cart:', currentQuantity);
        console.log('[CART] Requested to add:', quantity);
        console.log('[CART] Total would be:', totalRequestedQuantity);

        // Check stock availability
        try {
          const response = await fetch(`/api/products/${product.id}/check-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sizeId: size?.id,
              colorId: color?.id,
              requestedQuantity: totalRequestedQuantity,
            }),
          });

          if (!response.ok) {
            console.error('[CART] Stock check failed:', response.statusText);
            return { success: false, error: 'Failed to check stock availability' };
          }

          const stockData = await response.json();
          console.log('[CART] Stock check result:', stockData);

          if (!stockData.available) {
            const sizeLabel = size?.value ? ` in size ${size.value}` : '';
            const errorMessage = `Only ${stockData.availableStock} item${stockData.availableStock !== 1 ? 's' : ''} available${sizeLabel}`;
            console.warn('[CART] Insufficient stock:', errorMessage);
            return { success: false, error: errorMessage };
          }
        } catch (error) {
          console.error('[CART] Stock check error:', error);
          return { success: false, error: 'Unable to verify stock. Please try again.' };
        }
        
        // Stock is available, proceed with adding to cart
        set((state) => {
          console.log('[CART] Current cart items:', state.cart.items.length);
          
          const existingItemIndex = state.cart.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.selectedSize?.id === size?.id &&
              item.selectedColor?.id === color?.id
          );

          console.log('[CART] Existing item index:', existingItemIndex);

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

          console.log('[CART] Updated cart:', {
            itemsCount: updatedItems.length,
            total,
            itemCount
          });

          return {
            cart: {
              items: updatedItems,
              total,
              itemCount,
            },
          };
        });

        return { success: true };
      },

      removeItem: (productId: string, sizeId: string | null, colorId: string | null) => {
        set((state) => {
          const updatedItems = state.cart.items.filter(
            (item) => {
              // D'abord vérifier si c'est le bon produit
              if (item.product.id !== productId) return true;
              
              // Comparer les IDs en gérant null/undefined
              const sizeMatch = (item.selectedSize?.id || null) === (sizeId || null);
              const colorMatch = (item.selectedColor?.id || null) === (colorId || null);
              
              // Garder l'item seulement si size OU color ne correspond pas
              return !(sizeMatch && colorMatch);
            }
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

      updateQuantity: async (productId: string, sizeId: string | null, colorId: string | null, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId, sizeId, colorId);
          return { success: true };
        }

        console.log('[CART] Updating quantity:', { productId, sizeId, colorId, quantity });

        // Check stock availability for the new quantity
        try {
          const response = await fetch(`/api/products/${productId}/check-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sizeId,
              colorId,
              requestedQuantity: quantity,
            }),
          });

          if (!response.ok) {
            console.error('[CART] Stock check failed:', response.statusText);
            return { success: false, error: 'Failed to check stock availability' };
          }

          const stockData = await response.json();
          console.log('[CART] Stock check result:', stockData);

          if (!stockData.available) {
            const errorMessage = `Only ${stockData.availableStock} item${stockData.availableStock !== 1 ? 's' : ''} available`;
            console.warn('[CART] Insufficient stock:', errorMessage);
            return { success: false, error: errorMessage };
          }
        } catch (error) {
          console.error('[CART] Stock check error:', error);
          return { success: false, error: 'Unable to verify stock. Please try again.' };
        }

        set((state) => {
          const updatedItems = state.cart.items.map((item) => {
            // Vérifier si c'est le bon item
            const sizeMatch = (item.selectedSize?.id || null) === (sizeId || null);
            const colorMatch = (item.selectedColor?.id || null) === (colorId || null);
            const isTargetItem = item.product.id === productId && sizeMatch && colorMatch;
            
            return isTargetItem ? { ...item, quantity } : item;
          });

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

        return { success: true };
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

      refreshPrices: async () => {
        const currentCart = get().cart;
        if (currentCart.items.length === 0) return;

        console.log('[CART] Refreshing prices for', currentCart.items.length, 'items');

        try {
          // Fetch fresh prices for all products in cart
          const productIds = [...new Set(currentCart.items.map(item => item.product.id))];
          const priceUpdates = await Promise.all(
            productIds.map(async (productId) => {
              try {
                const response = await fetch(`/api/products/${productId}`);
                if (!response.ok) return null;
                const data = await response.json();
                return { productId, product: data.product };
              } catch (error) {
                console.error(`[CART] Failed to fetch price for product ${productId}:`, error);
                return null;
              }
            })
          );

          // Create a map of productId -> fresh product data
          const productMap = new Map();
          priceUpdates.forEach(update => {
            if (update) productMap.set(update.productId, update.product);
          });

          // Update cart items with fresh prices
          set((state) => {
            const updatedItems = state.cart.items.map(item => {
              const freshProduct = productMap.get(item.product.id);
              if (!freshProduct) return item;

              // If item has selected size, find the matching variant price
              let updatedPrice = freshProduct.price;
              if (item.selectedSize && freshProduct.variants) {
                const matchingVariant = freshProduct.variants.find((v: any) => {
                  const sizeMatch = !item.selectedSize || v.size?.id === item.selectedSize.id;
                  const colorMatch = !item.selectedColor || v.color?.id === item.selectedColor.id;
                  return sizeMatch && colorMatch;
                });
                if (matchingVariant) {
                  updatedPrice = matchingVariant.price;
                }
              }

              // Check if price has changed
              if (item.product.price !== updatedPrice) {
                console.log(`[CART] Price updated for ${item.product.name}: ${item.product.price} → ${updatedPrice}`);
              }

              return {
                ...item,
                product: {
                  ...item.product,
                  price: updatedPrice,
                  // Update other product fields that might have changed
                  name: freshProduct.name,
                  images: freshProduct.images,
                },
              };
            });

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

          console.log('[CART] Prices refreshed successfully');
        } catch (error) {
          console.error('[CART] Failed to refresh prices:', error);
        }
      },
    }),
    {
      name: 'maisonmiaro-cart',
    }
  )
);
