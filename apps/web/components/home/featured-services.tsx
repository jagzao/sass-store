'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sass-store/ui';
import { useTenant } from '@/lib/tenant/tenant-provider';

// Memoized service card component to prevent unnecessary re-renders
interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
    description: string;
  };
}

const ServiceCard = memo<ServiceCardProps>(({ service }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">{service.name}</CardTitle>
        <CardDescription>
          ${service.price} • {service.duration} minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {service.description}
        </p>
        <button
          data-testid="service-book-first-available"
          className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          Book First Available
        </button>
      </CardContent>
    </Card>
  );
});

ServiceCard.displayName = 'ServiceCard';

export function FeaturedServices() {
  const { tenant } = useTenant();

  // Memoize featured services filtering
  const featuredServices = useMemo(() => {
    if (tenant.mode !== 'booking' || !tenant.services) {
      return [];
    }
    return tenant.services.filter(service => service.featured);
  }, [tenant.mode, tenant.services]);

  if (tenant.mode !== 'booking' || !tenant.services || featuredServices.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Featured Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Book our most popular services with just 2 clicks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}