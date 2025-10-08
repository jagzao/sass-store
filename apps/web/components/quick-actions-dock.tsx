'use client';

import { useState, useEffect } from 'react';
import { Button } from '@sass-store/ui';
import {
  ShoppingCart,
  Calendar,
  Heart,
  HelpCircle,
  UserCheck,
  Clock,
  CreditCard,
  Plus,
  BarChart3,
  Settings,
  Download,
  DollarSign,
  Building2,
  TrendingUp
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenant-provider';
import { useCart } from '@/lib/cart/cart-store';

// Mock user role - in real app, this would come from auth
const useUserRole = () => {
  return 'customer'; // customer | staff | admin | owner
};

const roleActions = {
  customer: [
    { icon: Calendar, label: 'Book Now', action: 'book', href: '/booking' },
    { icon: ShoppingCart, label: 'Reorder', action: 'reorder' },
    { icon: Heart, label: 'Favorites', action: 'favorites', href: '/favorites' },
    { icon: HelpCircle, label: 'Help', action: 'help', href: '/help' }
  ],
  staff: [
    { icon: UserCheck, label: 'Check In', action: 'checkin' },
    { icon: Clock, label: 'Update Schedule', action: 'schedule' },
    { icon: Plus, label: 'New Booking', action: 'newbooking', href: '/booking' },
    { icon: CreditCard, label: 'Process Payment', action: 'payment' }
  ],
  admin: [
    { icon: Plus, label: 'Add Product', action: 'addproduct', href: '/admin/products/new' },
    { icon: BarChart3, label: 'Analytics', action: 'analytics', href: '/admin/analytics' },
    { icon: Settings, label: 'Manage Staff', action: 'staff', href: '/admin/staff' },
    { icon: Download, label: 'Export Data', action: 'export' }
  ],
  owner: [
    { icon: DollarSign, label: 'Cost Dashboard', action: 'costs', href: '/owner/costs' },
    { icon: Building2, label: 'Tenant Overview', action: 'tenants', href: '/owner/tenants' },
    { icon: TrendingUp, label: 'Performance', action: 'performance', href: '/owner/performance' },
    { icon: Settings, label: 'Settings', action: 'settings', href: '/owner/settings' }
  ]
};

export function QuickActionsDock() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const userRole = useUserRole();
  const { tenant } = useTenant();
  const { items } = useCart();

  const actions = roleActions[userRole as keyof typeof roleActions] || roleActions.customer;

  // Auto-hide dock on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleAction = (action: string, href?: string) => {
    switch (action) {
      case 'book':
        if (tenant.mode === 'booking') {
          window.location.href = href || '/booking';
        }
        break;
      case 'reorder':
        // Implement reorder logic
        console.log('Reorder action');
        break;
      case 'favorites':
        window.location.href = href || '/favorites';
        break;
      case 'help':
        window.location.href = href || '/help';
        break;
      default:
        if (href) {
          window.location.href = href;
        }
        break;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="quick-actions-dock">
      {actions.map((action) => {
        const Icon = action.icon;
        const isCart = action.action === 'reorder' || action.action === 'cart';
        const hasCartItems = isCart && items.length > 0;

        return (
          <Button
            key={action.action}
            variant="ghost"
            size="icon"
            className="relative touch-target hover:tenant-primary-bg hover:text-white transition-colors"
            onClick={() => handleAction(action.action, action.href)}
            aria-label={action.label}
          >
            <Icon className="h-5 w-5" />

            {/* Cart badge */}
            {hasCartItems && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full tenant-primary-bg text-white text-xs flex items-center justify-center">
                {items.length}
              </span>
            )}

            {/* Tooltip */}
            <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {action.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
}