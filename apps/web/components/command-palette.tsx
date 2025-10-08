'use client';

import { useState, useEffect, useMemo } from 'react';
import { Command } from 'cmdk';
import { Search, Calendar, ShoppingBag, User, Settings, ArrowRight } from 'lucide-react';
import { useTenant } from '@/lib/tenant/tenant-provider';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  action: () => void;
  category: 'products' | 'services' | 'actions' | 'staff' | 'settings';
  keywords: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { tenant } = useTenant();

  // Open with Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate command items based on tenant data
  const commandItems = useMemo((): CommandItem[] => {
    const items: CommandItem[] = [];

    // Products
    if (tenant.products) {
      tenant.products.forEach(product => {
        items.push({
          id: `product-${product.sku}`,
          title: product.name,
          description: `$${product.price} - ${product.category}`,
          action: () => {
            setIsOpen(false);
            window.location.href = `/products/${product.sku}`;
          },
          category: 'products',
          keywords: [product.name, product.category, product.description, product.sku]
        });
      });
    }

    // Services
    if (tenant.services) {
      tenant.services.forEach(service => {
        items.push({
          id: `service-${service.id}`,
          title: service.name,
          description: `$${service.price} - ${service.duration} min`,
          action: () => {
            setIsOpen(false);
            window.location.href = `/booking?service=${service.id}`;
          },
          category: 'services',
          keywords: [service.name, service.description, 'book', 'appointment']
        });
      });
    }

    // Staff
    if (tenant.staff) {
      tenant.staff.forEach(staff => {
        items.push({
          id: `staff-${staff.id}`,
          title: staff.name,
          description: staff.role,
          action: () => {
            setIsOpen(false);
            window.location.href = `/booking?staff=${staff.id}`;
          },
          category: 'staff',
          keywords: [staff.name, staff.role, ...staff.specialties]
        });
      });
    }

    // Quick actions
    items.push(
      {
        id: 'action-book',
        title: 'Book Appointment',
        description: 'Schedule a new appointment',
        action: () => {
          setIsOpen(false);
          window.location.href = '/booking';
        },
        category: 'actions',
        keywords: ['book', 'appointment', 'schedule', 'reserve']
      },
      {
        id: 'action-products',
        title: 'Browse Products',
        description: 'View all products',
        action: () => {
          setIsOpen(false);
          window.location.href = '/products';
        },
        category: 'actions',
        keywords: ['products', 'shop', 'buy', 'browse']
      },
      {
        id: 'action-cart',
        title: 'View Cart',
        description: 'See items in your cart',
        action: () => {
          setIsOpen(false);
          window.location.href = '/cart';
        },
        category: 'actions',
        keywords: ['cart', 'checkout', 'purchase', 'buy']
      }
    );

    return items;
  }, [tenant]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query) return commandItems.slice(0, 8); // Show recent/popular items

    const normalizedQuery = query.toLowerCase();
    return commandItems.filter(item =>
      item.keywords.some(keyword =>
        keyword.toLowerCase().includes(normalizedQuery)
      ) ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.description?.toLowerCase().includes(normalizedQuery)
    );
  }, [commandItems, query]);

  const categoryIcons = {
    products: ShoppingBag,
    services: Calendar,
    actions: ArrowRight,
    staff: User,
    settings: Settings
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette" onClick={() => setIsOpen(false)}>
      <div className="command-palette-content" onClick={(e) => e.stopPropagation()}>
        <Command>
          <div className="flex items-center border-b px-4 py-3">
            <Search className="h-4 w-4 mr-2 text-muted-foreground" />
            <Command.Input
              placeholder="Search products, services, or actions..."
              value={query}
              onValueChange={setQuery}
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {Object.entries(
              filteredItems.reduce((groups, item) => {
                const category = item.category;
                if (!groups[category]) groups[category] = [];
                groups[category].push(item);
                return groups;
              }, {} as Record<string, CommandItem[]>)
            ).map(([category, items]) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons];

              return (
                <Command.Group key={category} heading={
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Icon className="h-3 w-3" />
                    {category}
                  </div>
                }>
                  {items.map(item => (
                    <Command.Item
                      key={item.id}
                      onSelect={item.action}
                      className="flex items-center gap-3 px-2 py-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground data-[selected]:bg-accent data-[selected]:text-accent-foreground"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>

          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Use ↑↓ to navigate</span>
              <span>Press ↵ to select</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}