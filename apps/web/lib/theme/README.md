# Unified Theme System

Sistema centralizado de theming para SASS Store que maneja branding de tenants, modo claro/oscuro, y CSS custom properties.

## Características

- ✅ **Type-safe theme configuration**
- ✅ **Tenant-specific branding** (colores primarios/secundarios)
- ✅ **Modo claro/oscuro** con detección automática del sistema
- ✅ **CSS Custom Properties** para fácil integración
- ✅ **Responsive utilities**
- ✅ **Persistencia** en localStorage

## Uso Básico

### 1. Envolver la app con ThemeProvider

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/lib/theme/theme-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider defaultMode="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Usar el hook useTheme

```tsx
'use client';

import { useTheme } from '@/lib/theme/theme-provider';

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
      {mode === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### 3. Aplicar branding de tenant

```tsx
'use client';

import { useTheme } from '@/lib/theme/theme-provider';
import { useEffect } from 'react';

export function TenantBrandingApplier({ tenant }: { tenant: Tenant }) {
  const { setTenantBranding } = useTheme();

  useEffect(() => {
    setTenantBranding({
      primaryColor: tenant.branding.primaryColor,
      secondaryColor: tenant.branding.secondaryColor,
    });
  }, [tenant, setTenantBranding]);

  return null;
}
```

## Usando CSS Custom Properties

El theme system genera automáticamente variables CSS que puedes usar en tu código:

```tsx
// En componentes
<div
  className="bg-[var(--color-primary)] text-white"
  style={{ borderColor: 'var(--color-border)' }}
>
  Botón con color primario del tenant
</div>
```

```css
/* En CSS/SCSS */
.my-button {
  background-color: var(--color-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}
```

## Variables CSS Disponibles

### Colores
- `--color-primary`: Color primario del tenant
- `--color-secondary`: Color secundario
- `--color-accent`: Color de acento
- `--color-background`: Color de fondo
- `--color-foreground`: Color de texto principal
- `--color-muted`: Color apagado
- `--color-muted-foreground`: Texto apagado
- `--color-border`: Color de bordes
- `--color-success`: Verde para éxito
- `--color-warning`: Amarillo para advertencia
- `--color-error`: Rojo para errores
- `--color-info`: Azul para información

### Tipografía
- `--font-sans`: Fuente sans-serif
- `--font-serif`: Fuente serif
- `--font-mono`: Fuente monospace

### Border Radius
- `--radius-sm`: Border radius pequeño
- `--radius-md`: Border radius medio
- `--radius-lg`: Border radius grande
- `--radius-xl`: Border radius extra grande

### Sombras
- `--shadow-sm`: Sombra pequeña
- `--shadow-md`: Sombra media
- `--shadow-lg`: Sombra grande
- `--shadow-xl`: Sombra extra grande

## Utilities

### useThemeColors

```tsx
import { useThemeColors } from '@/lib/theme/theme-provider';

export function MyComponent() {
  const colors = useThemeColors();

  return (
    <div style={{ backgroundColor: colors.primary }}>
      Color primario
    </div>
  );
}
```

### useThemeTypography

```tsx
import { useThemeTypography } from '@/lib/theme/theme-provider';

export function MyComponent() {
  const typography = useThemeTypography();

  return (
    <p style={{ fontFamily: typography.fontFamily.sans }}>
      Texto con fuente del tema
    </p>
  );
}
```

### withOpacity

```tsx
import { withOpacity } from '@/lib/theme/theme-system';

const semiTransparentRed = withOpacity('#DC2626', 0.5);
// Returns: 'rgba(220, 38, 38, 0.5)'
```

### getContrastingTextColor

```tsx
import { getContrastingTextColor } from '@/lib/theme/theme-system';

const textColor = getContrastingTextColor('#DC2626');
// Returns: '#FFFFFF' (white text for dark background)
```

## Theme Modes

El sistema soporta 3 modos:

1. **'light'**: Modo claro forzado
2. **'dark'**: Modo oscuro forzado
3. **'system'**: Automático basado en preferencia del sistema

```tsx
const { mode, setMode } = useTheme();

// Cambiar a modo claro
setMode('light');

// Cambiar a modo oscuro
setMode('dark');

// Seguir preferencia del sistema
setMode('system');
```

## Ejemplo Completo: Botón con Theme

```tsx
'use client';

import { useThemeColors } from '@/lib/theme/theme-provider';
import { cn } from '@/lib/theme/theme-utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  const colors = useThemeColors();

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      color: 'white',
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary,
      borderColor: colors.primary,
    },
  };

  return (
    <button
      onClick={onClick}
      style={variantStyles[variant]}
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-all',
        'hover:opacity-90 active:scale-95',
        variant === 'outline' && 'border-2'
      )}
    >
      {children}
    </button>
  );
}
```

## Integración con Tailwind

El sistema de theming se integra perfectamente con Tailwind CSS:

```tsx
// Usar clases de Tailwind con variables CSS
<div className="bg-[var(--color-primary)] text-white p-4 rounded-[var(--radius-md)]">
  Contenido
</div>
```

## Migración desde el Sistema Actual

### Antes (inline styles con tenant branding)
```tsx
<div style={{ color: tenant.branding.primaryColor }}>
  Texto
</div>
```

### Después (usando theme system)
```tsx
<div className="text-[var(--color-primary)]">
  Texto
</div>
```

O con hook:
```tsx
const colors = useThemeColors();
<div style={{ color: colors.primary }}>
  Texto
</div>
```

## Best Practices

1. **Usa CSS variables para styles inline** en lugar de acceder directamente al objeto theme
2. **Aplica branding de tenant** en un componente raíz (layout o page)
3. **Usa los hooks** para acceder a colores/tipografía en lógica de JS
4. **Persiste el modo** en localStorage (ya lo hace el provider automáticamente)
5. **Usa utilities** como `cn()` para combinar clases de Tailwind

## Testing

```tsx
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/lib/theme/theme-provider';

describe('MyComponent', () => {
  it('renders with theme', () => {
    render(
      <ThemeProvider defaultMode="light">
        <MyComponent />
      </ThemeProvider>
    );
  });
});
```

## Troubleshooting

### Las variables CSS no funcionan

Asegúrate de que el `ThemeProvider` envuelve toda tu aplicación:

```tsx
// ✅ Correcto
<ThemeProvider>
  <App />
</ThemeProvider>

// ❌ Incorrecto (fuera del provider)
<div>
  <ThemeProvider>
    <Header />
  </ThemeProvider>
  <Content /> {/* No tiene acceso al theme */}
</div>
```

### El branding del tenant no se aplica

Verifica que estés llamando a `setTenantBranding` en un `useEffect`:

```tsx
useEffect(() => {
  setTenantBranding({
    primaryColor: tenant.branding.primaryColor,
    secondaryColor: tenant.branding.secondaryColor,
  });
}, [tenant]); // ✅ Incluye tenant en dependencies
```

### El modo oscuro no persiste

El ThemeProvider persiste automáticamente en localStorage. Si no funciona, verifica que no estés en modo servidor (usa 'use client').
