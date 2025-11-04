'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart/cart-store';
import { useSession } from 'next-auth/react';

// Component to handle cart synchronization with user accounts
export function CartSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { loadUserCart, saveCartToUser } = useCart();

  useEffect(() => {
    // Synchronize cart when user session changes
    if (status === 'authenticated' && session?.user?.id) {
      // Load cart from user account when user logs in
      loadUserCart();
    } else if (status === 'unauthenticated') {
      // When user logs out, we might want to save the cart for future sessions
      // though this is less critical as it's already persisted in localStorage
    }
  }, [status, session, loadUserCart, saveCartToUser]);

  useEffect(() => {
    // Save cart to user account periodically when user is authenticated
    if (status === 'authenticated' && session?.user?.id) {
      const interval = setInterval(() => {
        saveCartToUser();
      }, 30000); // Save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [status, session, saveCartToUser]);

  // Also save cart when user navigates away or closes the tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (status === 'authenticated' && session?.user?.id) {
        saveCartToUser();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status, session, saveCartToUser]);

  return <>{children}</>;
}