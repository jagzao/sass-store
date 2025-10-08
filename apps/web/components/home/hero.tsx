'use client';

import { Button } from '@sass-store/ui';
import { useTenant } from '@/lib/tenant/tenant-provider';

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary/10 to-secondary/5 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Welcome to Beauty Excellence
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover premium beauty services and products curated just for you.
            Book your appointment or shop our exclusive collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="tenant"
              size="lg"
              className="text-lg px-8"
            >
              Book Appointment
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8"
            >
              Shop Products
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}