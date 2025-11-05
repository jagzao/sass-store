'use client';

import { memo, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sass-store/ui';
import { useTenant } from '@/lib/tenant/tenant-provider';
import { useCart } from '@/lib/cart/cart-store';

interface Product {
  sku: string;
  name: string;
  price: number;
  description: string;
  featured?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

// Memoized ProductCard to prevent unnecessary re-renders
const ProductCard = memo<ProductCardProps>(({ product, onAddToCart }) => {
  const handleClick = useCallback(() => {
    onAddToCart(product);
  }, [product, onAddToCart]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <CardDescription>${product.price}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {product.description}
        </p>
        <button
          data-testid="product-add-btn"
          onClick={handleClick}
          className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors touch-target"
        >
          Add to Cart
        </button>
      </CardContent>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export function PopularProducts() {
  const { tenant } = useTenant();
  const { addItem } = useCart();

  // Memoize the filtered products list
  const featuredProducts = useMemo(() => {
    return tenant.products?.filter(product => product.featured) || [];
  }, [tenant.products]);

  // Memoize the add to cart handler
  const handleAddToCart = useCallback((product: Product) => {
    addItem({
      sku: product.sku,
      name: product.name,
      price: product.price
    });
  }, [addItem]);

  if (!tenant.products || featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Popular Products</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Add to cart with just 1 click
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.sku}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
}