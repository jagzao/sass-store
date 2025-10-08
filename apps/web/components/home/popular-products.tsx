'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sass-store/ui';
import { useTenant } from '@/lib/tenant/tenant-provider';
import { useCart } from '@/lib/cart/cart-store';

export function PopularProducts() {
  const { tenant } = useTenant();
  const { addItem } = useCart();

  if (!tenant.products) {
    return null;
  }

  const featuredProducts = tenant.products.filter(product => product.featured);

  const handleAddToCart = (product: any) => {
    addItem({
      sku: product.sku,
      name: product.name,
      price: product.price
    });
  };

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
            <Card key={product.sku} className="hover:shadow-lg transition-shadow">
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
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors touch-target"
                >
                  Add to Cart
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}