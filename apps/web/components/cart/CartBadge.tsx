'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart/cart-store';
import gsap from 'gsap';
import Link from 'next/link';

interface CartBadgeProps {
  tenantSlug: string;
  primaryColor?: string;
}

export default function CartBadge({ tenantSlug, primaryColor = '#3B82F6' }: CartBadgeProps) {
  const items = useCart((state) => state.items);
  const _deduplicateItems = useCart((state) => state._deduplicateItems);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const prevCountRef = useRef(0);

  // Filter items for current tenant, deduplicate, and calculate total
  const totalItems = _deduplicateItems(
    items.filter((item) => item.variant?.tenant === tenantSlug)
  ).reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    // Micro-bounce animation when count changes
    if (badgeRef.current && totalItems !== prevCountRef.current && totalItems > 0) {
      gsap.timeline()
        .to(badgeRef.current, {
          scale: 1.15,
          duration: 0.15,
          ease: 'power2.out'
        })
        .to(badgeRef.current, {
          scale: 1,
          duration: 0.15,
          ease: 'elastic.out(1, 0.3)'
        });
    }
    prevCountRef.current = totalItems;
  }, [totalItems]);

  if (totalItems === 0) return null;

  return (
    <Link
      href={`/t/${tenantSlug}/cart`}
      className="relative inline-block"
      aria-label={`Carrito con ${totalItems} ${totalItems === 1 ? 'artículo' : 'artículos'}`}
    >
      <span className="text-3xl" role="img" aria-hidden="true">
        🛒
      </span>
      <span
        ref={badgeRef}
        className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md"
        style={{ backgroundColor: primaryColor }}
        aria-live="polite"
      >
        {totalItems > 99 ? '99+' : totalItems}
      </span>
    </Link>
  );
}
