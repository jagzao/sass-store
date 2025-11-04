'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: Record<string, string>; // color, size, etc.
  stock?: number; // Available stock for validation
  error?: string; // Per-item error message
}

export interface CouponCode {
  code: string;
  discount: number; // Percentage or flat amount
  type: 'percentage' | 'flat';
  validUntil?: Date;
}

export interface DeletedItem extends CartItem {
  deletedAt: number;
}

interface CartStore {
  items: CartItem[];
  deletedItems: DeletedItem[];
  isOpen: boolean;
  lastActivity: number;
  appliedCoupon: CouponCode | null;
  couponError: string | null;
  shippingEstimate: number;
  taxEstimate: number;

  // Internal helpers
  _deduplicateItems: (items: CartItem[]) => CartItem[];
  _sanitizeItems: (items: CartItem[]) => CartItem[];

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  incrementQuantity: (sku: string) => void;
  decrementQuantity: (sku: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Undo functionality
  undoRemove: (sku: string) => void;
  clearDeletedItems: () => void;

  // Coupon functionality
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;

  // Validation
  validateItem: (sku: string) => void;
  hasErrors: () => boolean;

  // Computed (memoized)
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTax: () => number;
  getShipping: () => number;
  getTotal: () => number;
}

// Interface extension to include sync methods
interface CartStoreWithSync extends CartStore {
  syncCartWithUser: () => Promise<void>;
  loadUserCart: () => Promise<void>;
  saveCartToUser: () => Promise<void>;
}

// Cache for cart data to improve performance
const cartCache = new Map<string, { data: any; timestamp: number }>();

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

export const useCart = create<CartStoreWithSync>()(
  persist(
    (set, get) => ({
      items: [],
      deletedItems: [],
      isOpen: false,
      lastActivity: Date.now(),
      appliedCoupon: null,
      couponError: null,
      shippingEstimate: 50, // Default MXN 50
      taxEstimate: 0.16, // 16% IVA

      // Helper function to deduplicate items
      _deduplicateItems: (items: CartItem[]) => {
        const seen = new Map<string, CartItem>();
        items.forEach(item => {
          const existing = seen.get(item.sku);
          if (existing) {
            // Merge quantities
            seen.set(item.sku, {
              ...existing,
              quantity: existing.quantity + item.quantity
            });
          } else {
            seen.set(item.sku, item);
          }
        });
        return Array.from(seen.values());
      },

      // Helper to sanitize items (ensure price is number)
      _sanitizeItems: (items: CartItem[]) => {
        return items.map(item => ({
          ...item,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1
        }));
      },

      addItem: (newItem, quantity = 1) => {
        set((state) => {
          // DEBUG: Log para identificar duplicados
          console.log('[CART] addItem called:', {
            sku: newItem.sku,
            quantity,
            currentItems: state.items.length,
            existingSkus: state.items.map(i => i.sku)
          });

          const existingItem = state.items.find(item => item.sku === newItem.sku);

          let updatedItems;
          if (existingItem) {
            // INCREMENT the quantity (add to existing)
            const newQuantity = existingItem.quantity + quantity;
            console.log(`[CART] Incrementing ${newItem.sku}: ${existingItem.quantity} + ${quantity} = ${newQuantity}`);

            // Validate stock if available
            if (newItem.stock && newQuantity > newItem.stock) {
              updatedItems = state.items.map(item =>
                item.sku === newItem.sku
                  ? { ...item, error: `Solo hay ${newItem.stock} disponibles` }
                  : item
              );
            } else {
              updatedItems = state.items.map(item =>
                item.sku === newItem.sku
                  ? { ...item, quantity: newQuantity, error: undefined }
                  : item
              );
            }
          } else {
            // Add new item with specified quantity
            console.log(`[CART] Adding new item ${newItem.sku} with quantity ${quantity}`);
            updatedItems = [...state.items, { ...newItem, quantity }];
          }

          console.log('[CART] Updated items:', updatedItems.length);
          return {
            items: updatedItems,
            isOpen: true,
            lastActivity: Date.now()
          };
        });
      },

      removeItem: (sku) => {
        set((state) => {
          const itemToDelete = state.items.find(item => item.sku === sku);
          if (!itemToDelete) return state;

          return {
            items: state.items.filter(item => item.sku !== sku),
            deletedItems: [
              ...state.deletedItems,
              { ...itemToDelete, deletedAt: Date.now() }
            ],
            lastActivity: Date.now()
          };
        });
      },

      updateQuantity: (sku, quantity) => {
        if (quantity <= 0) {
          get().removeItem(sku);
          return;
        }

        set((state) => {
          const item = state.items.find(i => i.sku === sku);
          if (!item) return state;

          // Validate stock
          if (item.stock && quantity > item.stock) {
            return {
              items: state.items.map(i =>
                i.sku === sku
                  ? { ...i, error: `Solo hay ${item.stock} disponibles` }
                  : i
              ),
              lastActivity: Date.now()
            };
          }

          return {
            items: state.items.map(i =>
              i.sku === sku ? { ...i, quantity, error: undefined } : i
            ),
            lastActivity: Date.now()
          };
        });
      },

      incrementQuantity: (sku) => {
        const state = get();
        const item = state.items.find(i => i.sku === sku);
        if (!item) return;

        const newQuantity = item.quantity + 1;

        // Validate stock
        if (item.stock && newQuantity > item.stock) {
          set((state) => ({
            items: state.items.map(i =>
              i.sku === sku
                ? { ...i, error: `Solo hay ${item.stock} disponibles` }
                : i
            ),
            lastActivity: Date.now()
          }));
          return;
        }

        set((state) => ({
          items: state.items.map(i =>
            i.sku === sku ? { ...i, quantity: newQuantity, error: undefined } : i
          ),
          lastActivity: Date.now()
        }));
      },

      decrementQuantity: (sku) => {
        set((state) => {
          const item = state.items.find(i => i.sku === sku);
          if (!item) return state;

          if (item.quantity <= 1) {
            // Mark for deletion with undo option
            return {
              items: state.items.filter(i => i.sku !== sku),
              deletedItems: [
                ...state.deletedItems,
                { ...item, deletedAt: Date.now() }
              ],
              lastActivity: Date.now()
            };
          }

          return {
            items: state.items.map(i =>
              i.sku === sku ? { ...i, quantity: i.quantity - 1, error: undefined } : i
            ),
            lastActivity: Date.now()
          };
        });
      },

      clearCart: () => {
        set({
          items: [],
          deletedItems: [],
          appliedCoupon: null,
          couponError: null,
          isOpen: false,
          lastActivity: Date.now()
        });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen, lastActivity: Date.now() }));
      },

      openCart: () => {
        set({ isOpen: true, lastActivity: Date.now() });
      },

      closeCart: () => {
        set({ isOpen: false, lastActivity: Date.now() });
      },

      // Undo functionality
      undoRemove: (sku) => {
        set((state) => {
          const deletedItem = state.deletedItems.find(item => item.sku === sku);
          if (!deletedItem) return state;

          const { deletedAt, ...restoredItem } = deletedItem;

          return {
            items: [...state.items, restoredItem],
            deletedItems: state.deletedItems.filter(item => item.sku !== sku),
            lastActivity: Date.now()
          };
        });
      },

      clearDeletedItems: () => {
        set({ deletedItems: [] });
      },

      // Coupon functionality
      applyCoupon: async (code: string) => {
        // Simulate API call
        set({ couponError: null });

        try {
          // Mock validation - replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 500));

          const validCoupons: Record<string, CouponCode> = {
            'SAVE10': { code: 'SAVE10', discount: 10, type: 'percentage' },
            'FLAT50': { code: 'FLAT50', discount: 50, type: 'flat' },
            'WELCOME20': { code: 'WELCOME20', discount: 20, type: 'percentage' }
          };

          const coupon = validCoupons[code.toUpperCase()];

          if (!coupon) {
            set({ couponError: 'Cupón inválido o expirado', appliedCoupon: null });
            return;
          }

          set({
            appliedCoupon: coupon,
            couponError: null,
            lastActivity: Date.now()
          });
        } catch (error) {
          set({ couponError: 'Error al validar cupón', appliedCoupon: null });
        }
      },

      removeCoupon: () => {
        set({ appliedCoupon: null, couponError: null, lastActivity: Date.now() });
      },

      // Validation
      validateItem: (sku) => {
        const state = get();
        const item = state.items.find(i => i.sku === sku);
        if (!item) return;

        if (item.stock && item.quantity > item.stock) {
          set((state) => ({
            items: state.items.map(i =>
              i.sku === sku
                ? { ...i, error: `Solo hay ${item.stock} disponibles` }
                : i
            )
          }));
        }
      },

      hasErrors: () => {
        return get().items.some(item => item.error);
      },

      // Computed values (memoized)
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + (item.price * item.quantity),
          0
        );
      },

      getDiscount: () => {
        const state = get();
        if (!state.appliedCoupon) return 0;

        const subtotal = state.getSubtotal();
        const { discount, type } = state.appliedCoupon;

        if (type === 'percentage') {
          return (subtotal * discount) / 100;
        }
        return discount;
      },

      getTax: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        const discount = state.getDiscount();
        return (subtotal - discount) * state.taxEstimate;
      },

      getShipping: () => {
        const state = get();
        // Free shipping for orders over 500 MXN
        return state.getSubtotal() > 500 ? 0 : state.shippingEstimate;
      },

      getTotal: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        const discount = state.getDiscount();
        const tax = state.getTax();
        const shipping = state.getShipping();
        return subtotal - discount + tax + shipping;
      },

      // Synchronization methods
      syncCartWithUser: async () => {
        // First, try to load the cart from user account if logged in
        await get().loadUserCart();
        
        // Then save current cart to user account
        await get().saveCartToUser();
      },

      loadUserCart: async () => {
        // Check if user is authenticated
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
          // User not authenticated, nothing to load
          return;
        }
        
        const session = await response.json();
        if (!session?.user?.id) {
          // No user in session, nothing to load
          return;
        }

        try {
          // Fetch user's cart from the backend
          const cartResponse = await fetch(`/api/users/${session.user.id}/cart`);
          if (cartResponse.ok) {
            const userData = await cartResponse.json();
            const userCartItems = userData.cart || [];
            
            // Merge user cart with existing local cart
            set((state) => {
              // Create a map of existing items by SKU for easy lookup
              const existingItemsMap = new Map(state.items.map(item => [item.sku, item]));
              
              // Process user cart items
              const mergedItems = [...userCartItems];
              
              // Add items that are in local storage but not in user cart
              state.items.forEach(item => {
                if (!existingItemsMap.has(item.sku)) {
                  mergedItems.push(item);
                } else {
                  // If item exists in both, use the quantity from the cart with highest quantity
                  const existingUserItem = userCartItems.find((userItem: any) => userItem.sku === item.sku);
                  if (existingUserItem && existingUserItem.quantity < item.quantity) {
                    mergedItems[mergedItems.findIndex((i: any) => i.sku === item.sku)] = item;
                  }
                }
              });
              
              return {
                ...state,
                items: mergedItems,
                lastActivity: Date.now()
              };
            });
          }
        } catch (error) {
          console.error('Error loading user cart:', error);
        }
      },

      saveCartToUser: async () => {
        // Check if user is authenticated
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
          // User not authenticated, can't save to user account
          return;
        }
        
        const session = await response.json();
        if (!session?.user?.id) {
          // No user in session, can't save to user account
          return;
        }

        // Get current cart items
        const state = get();
        
        try {
          // Save current cart to user account
          await fetch(`/api/users/${session.user.id}/cart`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cart: state.items }),
          });
        } catch (error) {
          console.error('Error saving cart to user:', error);
        }
      },
    }),
    {
      name: 'sass-store-cart',
      partialize: (state) => ({
        items: state.items,
        deletedItems: state.deletedItems,
        appliedCoupon: state.appliedCoupon,
        lastActivity: state.lastActivity
      }),
      // Sanitize and deduplicate data when loading from storage
      onRehydrateStorage: () => (state) => {
        if (state && state.items.length > 0) {
          console.log('[CART] Rehydrating from storage, sanitizing and deduplicating items...');
          const sanitized = state._sanitizeItems(state.items);
          const deduplicated = state._deduplicateItems(sanitized);

          if (deduplicated.length < state.items.length) {
            console.warn(`[CART] Removed ${state.items.length - deduplicated.length} duplicate items during rehydration`);
          }

          state.items = deduplicated;
        }
      }
    }
  )
);

// Auto-close cart after inactivity
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { lastActivity, isOpen, closeCart } = useCart.getState();
    const inactiveTime = Date.now() - lastActivity;

    // Auto-close after 30 seconds of inactivity
    if (isOpen && inactiveTime > 30000) {
      closeCart();
    }
  }, 5000);
}