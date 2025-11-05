'use client';

import { memo, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTenantSlug } from '@/lib/tenant/client-resolver';

interface UnfinishedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  tenant: string;
  tenantName: string;
  addedToCart: string;
  progress: 'cart' | 'checkout' | 'payment';
}

const unfinishedItems: UnfinishedItem[] = [
  {
    id: '1',
    name: 'Custom Nail Art',
    price: 75.00,
    image: '🎨',
    tenant: 'wondernails',
    tenantName: 'Wonder Nails',
    addedToCart: '2024-01-16 10:30',
    progress: 'cart'
  },
  {
    id: '2',
    name: 'Vainilla Premium 100g',
    price: 45.00,
    image: '🍨',
    tenant: 'vainilla-vargas',
    tenantName: 'Vainilla Vargas',
    addedToCart: '2024-01-15 16:45',
    progress: 'checkout'
  },
  {
    id: '3',
    name: 'Private Tennis Lesson',
    price: 120.00,
    image: '🏆',
    tenant: 'centro-tenistico',
    tenantName: 'Centro Tenístico',
    addedToCart: '2024-01-14 14:20',
    progress: 'payment'
  },
  {
    id: '4',
    name: 'Custom Mobile App',
    price: 2499.00,
    image: '📱',
    tenant: 'zo-system',
    tenantName: 'Zo System',
    addedToCart: '2024-01-13 11:15',
    progress: 'checkout'
  },
  {
    id: '5',
    name: 'Deployment Setup',
    price: 350.00,
    image: '🚀',
    tenant: 'zo-system',
    tenantName: 'Zo System',
    addedToCart: '2024-01-12 09:30',
    progress: 'cart'
  }
];

// Move pure functions outside component to prevent recreation
const getProgressInfo = (progress: string) => {
  switch (progress) {
    case 'cart':
      return { text: 'En carrito', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    case 'checkout':
      return { text: 'En checkout', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
    case 'payment':
      return { text: 'En pago', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    default:
      return { text: 'Pendiente', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
  }
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Hace menos de 1 hora';
  if (diffInHours < 24) return `Hace ${diffInHours} horas`;
  return `Hace ${Math.floor(diffInHours / 24)} días`;
};

// Memoized card component to prevent unnecessary re-renders
interface UnfinishedItemCardProps {
  item: UnfinishedItem;
  onContinue: (item: UnfinishedItem) => void;
  onRemove: (item: UnfinishedItem) => void;
}

const UnfinishedItemCard = memo<UnfinishedItemCardProps>(({ item, onContinue, onRemove }) => {
  const progressInfo = getProgressInfo(item.progress);

  const handleContinueClick = useCallback(() => {
    onContinue(item);
  }, [item, onContinue]);

  const handleRemoveClick = useCallback(() => {
    onRemove(item);
  }, [item, onRemove]);

  return (
    <div
      className="group bg-white border border-gray-200 rounded-2xl shadow-xs hover:shadow-panel transition-all duration-200 overflow-hidden"
      style={{ borderLeftColor: 'var(--color-brand, #DC2626)', borderLeftWidth: '4px' }}
    >
      {/* Ticket Header con Trophy Icon */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-amber-600 text-sm">🏆</span>
          </div>
          <div>
            <h3 className="font-semibold text-base text-gray-900">{item.name}</h3>
            <p className="text-xs text-gray-500">{item.tenantName}</p>
          </div>
        </div>

        {/* Status Badge - Compact */}
        <div className={`px-2 py-1 rounded-md text-xs font-medium ${progressInfo.color} ${progressInfo.bg}`}>
          {progressInfo.text}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl">{item.image}</div>
          <span className="text-xl font-bold" style={{ color: 'var(--color-brand, #DC2626)' }}>${item.price}</span>
        </div>

        {/* Time Chip */}
        <div className="mb-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            {getTimeAgo(item.addedToCart)}
          </span>
        </div>

        <div className="space-y-3">
          {/* Continue Button - Rojo sólido */}
          <button
            onClick={handleContinueClick}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:translate-y-[-1px]"
          >
            Continuar
          </button>

          {/* Secondary Link - Minimal */}
          <button
            onClick={handleRemoveClick}
            className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors py-1"
          >
            Ver detalles
          </button>
        </div>
      </div>
    </div>
  );
});

UnfinishedItemCard.displayName = 'UnfinishedItemCard';

export function ContinueShopping() {
  // TENANT-AWARE: Only show items from current tenant
  const currentTenantSlug = useTenantSlug();
  const router = useRouter();

  // Memoize filtered items
  const tenantFilteredItems = useMemo(() =>
    unfinishedItems.filter((item) => item.tenant === currentTenantSlug),
    [currentTenantSlug]
  );

  // If no items for current tenant, don't render the section
  if (tenantFilteredItems.length === 0) {
    return null;
  }

  // Memoize action handlers
  const handleContinue = useCallback((item: UnfinishedItem) => {
    // Navigate to appropriate step based on progress
    let targetUrl: string;

    switch (item.progress) {
      case 'cart':
        targetUrl = `/t/${item.tenant}/cart`;
        break;
      case 'checkout':
        targetUrl = `/t/${item.tenant}/checkout`;
        break;
      case 'payment':
        targetUrl = `/t/${item.tenant}/checkout?step=payment`;
        break;
      default:
        targetUrl = `/t/${item.tenant}/cart`;
    }

    router.push(targetUrl);
  }, [router]);

  const handleRemove = useCallback((item: UnfinishedItem) => {
    // Remove from saved items (tenant-scoped)
    // This would connect to an API endpoint in production
    if (confirm(`¿Eliminar "${item.name}" de tu lista?`)) {
      // API call would go here: DELETE /api/saved-items/${item.id}
      console.log(`Removing item ${item.id} for tenant ${item.tenant}`);
      // TODO: Connect to actual API endpoint when implemented
    }
  }, []);

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Retoma tu compra</h2>
        <button className="text-red-600 hover:text-red-700 font-medium hover:underline transition-all">
          Ver todo guardado →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tenantFilteredItems.map((item) => (
          <UnfinishedItemCard
            key={item.id}
            item={item}
            onContinue={handleContinue}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </section>
  );
}