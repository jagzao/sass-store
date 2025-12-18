# Corrección de Validación de Correo Electrónico con Caracteres Unicode

## Problema

El sistema rechazaba correos electrónicos que contenían la letra "ñ" y otros caracteres Unicode (como acentos) durante el proceso de registro de usuarios. Esto afectaba principalmente a usuarios hispanohablantes que utilizan estos caracteres en sus direcciones de correo electrónico.

## Causa del Problema

El problema se debía a dos validaciones de correo electrónico:

1. **Validación en el cliente**: En el componente `RegisterForm.tsx` se utilizaba una expresión regular básica `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` que, aunque teóricamente debería aceptar caracteres Unicode, no estaba explícitamente configurada para ellos.

2. **Validación en el servidor**: En el endpoint `/api/auth/register/route.ts` se utilizaba el método `z.string().email()` de Zod, que utiliza una validación de correo electrónico estándar más restrictiva y no acepta caracteres Unicode como la "ñ".

## Solución Implementada

### 1. Modificación en el Componente RegisterForm

**Archivo**: `apps/web/components/auth/RegisterForm.tsx`

**Cambio**:

- Se reemplazó la expresión regular básica por una que acepta explícitamente caracteres Unicode del español.

```typescript
// Antes
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Después
const emailRegex =
  /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ._%+-]+@[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ.-]+\.[a-zA-Z]{2,}$/;
```

Esta nueva expresión regular acepta:

- Letras mayúsculas y minúsculas estándar (a-z, A-Z)
- Números (0-9)
- Caracteres Unicode del español: ñ, Ñ, á, é, í, ó, ú, Á, É, Í, Ó, Ú, ü, Ü
- Caracteres permitidos en correos electrónicos: ., \_, %, +, -
- Formato de dominio estándar

### 2. Modificación en el Endpoint de Registro

**Archivo**: `apps/web/app/api/auth/register/route.ts`

**Cambio**:

- Se reemplazó la validación `z.string().email()` por una validación personalizada con la misma expresión regular utilizada en el cliente.

```typescript
// Antes
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  tenantSlug: z.string(),
  phone: z.string().optional(),
});

// Después
const emailRegex =
  /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ._%+-]+@[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚüÜ.-]+\.[a-zA-Z]{2,}$/;

const registerSchema = z.object({
  name: z.string().min(2),
  email: z
    .string()
    .regex(emailRegex, {
      message: "El formato del correo electrónico es inválido",
    }),
  password: z.string().min(8),
  tenantSlug: z.string(),
  phone: z.string().optional(),
});
```

### 3. Pruebas Automatizadas

**Archivo**: `tests/e2e/email-validation.spec.ts`

Se crearon pruebas automatizadas para validar que el sistema acepte correctamente correos electrónicos con caracteres Unicode:

1. **Prueba con ñ en la parte local**: Verifica que se acepte un correo como `estefagranillomuñoz@gmail.com`
2. **Prueba con ñ en el dominio**: Verifica que se acepte un correo como `juan.perez@miñonia.com`
3. **Prueba con acentos**: Verifica que se acepte un correo como `maría.gonzález@ejemplo.com`
4. **Prueba de rechazo**: Verifica que se rechacen correctamente correos con formato inválido

## Validación

Para verificar que la solución funciona correctamente:

1. Ejecutar las pruebas automatizadas:

   ```bash
   npm run test:e2e -- tests/e2e/email-validation.spec.ts
   ```

2. Probar manualmente el registro con correos que contengan caracteres Unicode.

## Impacto

Este cambio permite que usuarios hispanohablantes puedan registrarse con direcciones de correo electrónico que contienen caracteres especiales del español, mejorando la experiencia de usuario y la accesibilidad de la plataforma.

## Consideraciones de Seguridad

La expresión regular utilizada sigue siendo lo suficientemente restrictiva para prevenir formatos de correo inválidos, pero lo suficientemente flexible para aceptar caracteres Unicode comunes en el español. No se han comprometido las medidas de seguridad existentes.

## Mantenimiento

Si se necesita soportar caracteres Unicode de otros idiomas en el futuro, la expresión regular puede ser expandida para incluir esos caracteres específicos.
