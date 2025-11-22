import { API_CONFIG } from './api-config';
import { Product, ProductVariant, Category } from '@/types';

export interface InventoryItem {
  productId: string;
  variantId?: string;
  sku: string;
  quantity: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  restockDate?: string;
  supplier?: string;
  cost: number;
  location?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  variantId?: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'reserved' | 'unreserved';
  quantity: number;
  reason: string;
  timestamp: Date;
  userId?: string;
  orderId?: string;
  reference?: string;
}

export interface LowStockAlert {
  productId: string;
  variantId?: string;
  sku: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  lastSaleDate?: Date;
  velocity: number; // Units sold per day
  daysUntilStockout: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProductSyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export class ProductService {
  // Product CRUD Operations
  static async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Product creation failed' };
      }

      return { success: true, product: data.product };
    } catch (error) {
      console.error('Product creation failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  static async updateProduct(id: string, productData: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Product update failed' };
      }

      return { success: true, product: data.product };
    } catch (error) {
      console.error('Product update failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  static async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Product deletion failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Product deletion failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  static async getProduct(id: string): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      const response = await fetch(`/api/products/${id}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Product not found' };
      }

      return { success: true, product: data.product };
    } catch (error) {
      console.error('Product fetch failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  static async getProducts(filters?: {
    category?: string;
    search?: string;
    priceMin?: number;
    priceMax?: number;
    inStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; products?: Product[]; total?: number; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Products fetch failed' };
      }

      return { success: true, products: data.products, total: data.total };
    } catch (error) {
      console.error('Products fetch failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Product Variants
  static async createVariant(productId: string, variantData: Omit<ProductVariant, 'id'>): Promise<{ success: boolean; variant?: ProductVariant; error?: string }> {
    try {
      const response = await fetch(`/api/products/${productId}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variantData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Variant creation failed' };
      }

      return { success: true, variant: data.variant };
    } catch (error) {
      console.error('Variant creation failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Product Images
  static async uploadProductImage(productId: string, file: File): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Image upload failed' };
      }

      return { success: true, imageUrl: data.url };
    } catch (error) {
      console.error('Image upload failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Bulk Operations
  static async bulkUpdatePrices(updates: { productId: string; price: number; salePrice?: number }[]): Promise<{ success: boolean; updated: number; error?: string }> {
    try {
      const response = await fetch('/api/products/bulk-update-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, updated: 0, error: data.error || 'Bulk update failed' };
      }

      return { success: true, updated: data.updated };
    } catch (error) {
      console.error('Bulk price update failed:', error);
      return { success: false, updated: 0, error: 'Network error occurred' };
    }
  }

  // Platform Sync
  static async syncWithShopify(): Promise<ProductSyncResult> {
    try {
      const response = await fetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, synced: 0, failed: 0, errors: [data.error || 'Sync failed'] };
      }

      return data;
    } catch (error) {
      console.error('Shopify sync failed:', error);
      return { success: false, synced: 0, failed: 0, errors: ['Network error occurred'] };
    }
  }
}

export class InventoryService {
  // Stock Management
  static async getStock(productId: string, variantId?: string): Promise<{ success: boolean; inventory?: InventoryItem; error?: string }> {
    try {
      const params = new URLSearchParams({ productId });
      if (variantId) params.append('variantId', variantId);

      const response = await fetch(`/api/inventory/stock?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Stock fetch failed' };
      }

      return { success: true, inventory: data.inventory };
    } catch (error) {
      console.error('Stock fetch failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  static async updateStock(
    productId: string,
    quantity: number,
    type: 'set' | 'increment' | 'decrement',
    reason: string,
    variantId?: string
  ): Promise<{ success: boolean; newQuantity?: number; error?: string }> {
    try {
      const response = await fetch('/api/inventory/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          variantId,
          quantity,
          type,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Stock update failed' };
      }

      return { success: true, newQuantity: data.newQuantity };
    } catch (error) {
      console.error('Stock update failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Stock Reservations (for pending orders)
  static async reserveStock(items: { productId: string; variantId?: string; quantity: number }[], orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/inventory/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Stock reservation failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Stock reservation failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  static async releaseReservation(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/inventory/reservations/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Reservation release failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Reservation release failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Low Stock Alerts
  static async getLowStockAlerts(): Promise<{ success: boolean; alerts?: LowStockAlert[]; error?: string }> {
    try {
      const response = await fetch('/api/inventory/alerts');
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Alerts fetch failed' };
      }

      return { success: true, alerts: data.alerts };
    } catch (error) {
      console.error('Alerts fetch failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Stock Movements History
  static async getStockMovements(
    productId?: string,
    variantId?: string,
    type?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ success: boolean; movements?: StockMovement[]; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (productId) params.append('productId', productId);
      if (variantId) params.append('variantId', variantId);
      if (type) params.append('type', type);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/inventory/movements?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Movements fetch failed' };
      }

      return { success: true, movements: data.movements };
    } catch (error) {
      console.error('Movements fetch failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Reorder Management
  static async setReorderPoint(productId: string, variantId: string | undefined, reorderPoint: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/inventory/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, variantId, reorderPoint }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Reorder point update failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('Reorder point update failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  // Inventory Reports
  static async getInventoryReport(
    filters?: {
      category?: string;
      lowStock?: boolean;
      outOfStock?: boolean;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ success: boolean; report?: any; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            if (value instanceof Date) {
              params.append(key, value.toISOString());
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await fetch(`/api/inventory/report?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Report generation failed' };
      }

      return { success: true, report: data.report };
    } catch (error) {
      console.error('Report generation failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }
}

// Utility functions for inventory management
export const calculateStockVelocity = (salesData: { date: Date; quantity: number }[], days: number = 30): number => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentSales = salesData.filter(sale => sale.date >= cutoffDate);
  const totalSold = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);
  
  return totalSold / days;
};

export const estimateDaysUntilStockout = (currentStock: number, velocity: number): number => {
  if (velocity <= 0) return Infinity;
  return Math.floor(currentStock / velocity);
};

export const categorizeStockAlert = (daysUntilStockout: number): LowStockAlert['priority'] => {
  if (daysUntilStockout <= 3) return 'critical';
  if (daysUntilStockout <= 7) return 'high';
  if (daysUntilStockout <= 14) return 'medium';
  return 'low';
};
