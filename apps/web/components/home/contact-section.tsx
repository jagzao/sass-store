'use client';

import { useTenant } from '@/lib/tenant/tenant-provider';

export function ContactSection() {
  const { tenant } = useTenant();

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Visit Us</h2>
            <p className="text-muted-foreground">
              Find us at our convenient location
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Contact Information</h3>

              <div>
                <h4 className="font-medium">Phone</h4>
                <p data-testid="tenant-phone" className="text-muted-foreground">
                  {tenant.contact.phone}
                </p>
              </div>

              <div>
                <h4 className="font-medium">Email</h4>
                <p className="text-muted-foreground">
                  {tenant.contact.email}
                </p>
              </div>

              <div>
                <h4 className="font-medium">Address</h4>
                <p data-testid="tenant-address" className="text-muted-foreground">
                  {tenant.contact.address}
                </p>
              </div>

              <div>
                <h4 className="font-medium">Hours</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {Object.entries(tenant.contact.hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize">{day}:</span>
                      <span>{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <h4 className="font-medium mb-4">Location Map</h4>
              <p className="text-sm text-muted-foreground">
                Interactive map would be displayed here
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Lat: {tenant.location.latitude}, Lng: {tenant.location.longitude}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}