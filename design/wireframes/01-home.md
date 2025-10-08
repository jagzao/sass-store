# Home Page Wireframe

## Layout Structure

```
[Header: Logo | Search | Cart(2) | Profile]
[Hero Section: Salon branding + Quick Actions Dock]
[Featured Services Grid: 2x2 on mobile, 4x2 on desktop]
[Quick Booking CTA: "Book Your Next Appointment"]
[Popular Products Grid: 3 columns mobile, 6 columns desktop]
[Footer: Contact | Hours | Location Map]
```

## Key Components

### Header (Persistent)

- **Logo**: Tenant-branded logo (left)
- **Search**: Cmd+K trigger with "Search services, products..." placeholder
- **Mini-cart**: Badge with item count, click to open overlay
- **Profile**: Avatar with role indicator (Customer/Staff/Admin/Owner)

### Hero Section

- **Background**: Tenant-customized hero image
- **Overlay**: Semi-transparent with tenant tagline
- **Primary CTA**: "Book Now" button (prominent, pulse animation)
- **Secondary CTA**: "Shop Products" (ghost style)

### Quick Actions Dock (Role-Aware)

**Customer Role:**

- Book Now (primary)
- Reorder (ghost)
- Favorites (ghost)
- Help (ghost)

**Staff Role:**

- Check In (primary)
- New Booking (secondary)
- Update Schedule (ghost)
- Process Payment (ghost)

### Featured Services Grid

- **Service Cards**: Image, title, price, duration
- **Quick Book**: "First Available" button on each card
- **Hover State**: Lift animation, shadow increase
- **Mobile**: Horizontal scroll with snap points

### Popular Products Grid

- **Product Cards**: Image, title, price, rating
- **1-Click Add**: Direct add-to-cart button
- **Visual Feedback**: Success checkmark animation
- **Loading State**: Skeleton loaders during fetch

## Responsive Behavior

- **Mobile**: Stack vertically, larger touch targets
- **Tablet**: 2-column layout for services/products
- **Desktop**: Full grid layout with hover states

## Accessibility Features

- **Keyboard Navigation**: Tab order through all interactive elements
- **Screen Reader**: Alt text for images, ARIA labels
- **Focus Indicators**: High contrast outline on focus
- **Color Contrast**: All text meets WCAG AA standards

## Performance Optimizations

- **Image Lazy Loading**: Below-fold content loads on scroll
- **Critical CSS**: Inline above-fold styles
- **Preload**: Hero image and critical fonts
- **Service Worker**: Cache for offline viewing
