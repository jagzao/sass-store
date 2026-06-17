# Hero Section Customization

## Overview

The Hero Section can be customized per tenant through the `heroConfig` field in the tenant's branding data.

## Configuration Options

```typescript
interface HeroConfig {
  title?: string; // Custom title (default: "Bienvenido a [TenantName]")
  subtitle?: string; // Custom subtitle (default: tenant description)
  backgroundType?: "gradient" | "image" | "solid"; // Background style
  backgroundImage?: string; // URL for image background
  showContactInfo?: boolean; // Show contact pills (default: true)
  showActionButtons?: boolean; // Show CTA buttons (default: true)
  customCTA?: Array<{
    // Custom call-to-action buttons
    text: string;
    href: string;
    style?: "primary" | "secondary";
  }>;
  layout?: "center" | "left" | "right"; // Text alignment
  textColor?: "white" | "black" | "primary"; // Text color
  overlayOpacity?: number; // Overlay opacity for image backgrounds (0-1)
}
```

## Example Implementation

```typescript
// In tenant branding data
branding: {
  primaryColor: "#EC4899",
  heroConfig: {
    title: "💅 ¡Transforma tus uñas en obras de arte!",
    subtitle: "El estudio de uñas más exclusivo de México.",
    backgroundType: "gradient",
    layout: "center",
    textColor: "white",
    customCTA: [
      {
        text: "🎨 Ver Nail Art",
        href: "/t/wondernails/services",
        style: "primary"
      },
      {
        text: "💎 Productos Premium",
        href: "/t/wondernails/products",
        style: "secondary"
      }
    ]
  }
}
```

## Default Behavior

If no `heroConfig` is provided, the Hero Section will use:

- Title: "Bienvenido a [Tenant Name]"
- Subtitle: Tenant description
- Background: Gradient using primary color
- Standard action buttons based on tenant mode
- Contact information display enabled
