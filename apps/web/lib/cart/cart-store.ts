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
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  lastActivity: number;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed
  totalItems: number;
  totalPrice: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastActivity: Date.now(),

      addItem: (newItem) => {
        set((state) => {
          const existingItem = state.items.find(item => item.sku === newItem.sku);

          let updatedItems;
          if (existingItem) {
            // Update quantity of existing item
            updatedItems = state.items.map(item =>
              item.sku === newItem.sku
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            // Add new item
            updatedItems = [...state.items, { ...newItem, quantity: 1 }];
          }

          return {
            items: updatedItems,
            isOpen: true, // Auto-open cart when item is added
            lastActivity: Date.now()
          };
        });
      },

      removeItem: (sku) => {
        set((state) => ({
          items: state.items.filter(item => item.sku !== sku),
          lastActivity: Date.now()
        }));
      },

      updateQuantity: (sku, quantity) => {
        if (quantity <= 0) {
          get().removeItem(sku);
          return;
        }

        set((state) => ({
          items: state.items.map(item =>
            item.sku === sku ? { ...item, quantity } : item
          ),
          lastActivity: Date.now()
        }));
      },

      clearCart: () => {
        set({ items: [], isOpen: false, lastActivity: Date.now() });
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

      get totalItems() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get totalPrice() {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'sass-store-cart',
      partialize: (state) => ({
        items: state.items,
        lastActivity: state.lastActivity
      }),
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