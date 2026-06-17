# Cómo Ejecutar la Migración en Supabase

## Opción 1: SQL Editor (Recomendado)

1. **Abrir el panel de Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - Inicia sesión y selecciona tu proyecto
   - Haz clic en "SQL Editor" en el menú lateral

2. **Crear nueva consulta**
   - Haz clic en "New query"
   - Copia y pega todo el contenido del archivo `social-media-migration.sql`

3. **Ejecutar la migración**
   - Haz clic en "Run" o presiona Ctrl+Enter
   - Verifica que no haya errores en la consola

## Opción 2: Script del Archivo

1. **Abrir el archivo**
   - Abre el archivo `C:\Dev\Zo\sass-store\social-media-migration.sql` en un editor de texto

2. **Copiar todo el contenido**
   - Selecciona todo el texto (Ctrl+A)
   - Copia (Ctrl+C)

3. **Pegar en SQL Editor de Supabase**
   - En el panel de Supabase, ve a "SQL Editor"
   - Haz clic en "New query"
   - Pega el contenido (Ctrl+V)
   - Haz clic en "Run"

## Opción 3: Usar el Archivo Directamente

Si prefieres subir el archivo:

1. **Comprimir el archivo SQL**
   - Haz clic derecho en `social-media-migration.sql`
   - Selecciona "Enviar a" > "Carpeta comprimida"

2. **Subir a Supabase**
   - En el panel de Supabase, ve a "SQL Editor"
   - Haz clic en "Upload file"
   - Selecciona el archivo ZIP que creaste
   - Supabase extraerá y ejecutará el SQL automáticamente

## Verificación

Después de ejecutar la migración, verifica que se hayan creado las tablas:

```sql
-- Verificar tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'social_%'
ORDER BY table_name;
```

Deberías ver:

- social_posts
- social_post_variants
- tenant_social_platforms
- social_content_library
- social_post_analytics

## Probar el Módulo

Una vez ejecutada la migración:

1. **Iniciar la aplicación**

   ```bash
   npm run dev
   ```

2. **Probar las rutas**
   - Visita `http://localhost:3001/t/wondernails/social`
   - Visita `http://localhost:3001/t/zosystem/social`

3. **Verificar funcionalidades**
   - Calendario con vista mensual/semanal/lista
   - Editor Drawer para crear posts
   - Generador de contenido con IA
   - Cola de publicaciones
   - Analytics de rendimiento
   - Biblioteca de contenido

## Notas Importantes

- **La migración es segura** - No borra datos existentes
- **Es idempotente** - Puedes ejecutarla múltiples veces sin problemas
- **Incluye RLS** - Políticas de seguridad multitenant
- **Crea datos iniciales** - Ejemplos para empezar a usar el módulo

Si encuentras algún error durante la ejecución, revisa que:

- Estés en el proyecto correcto de Supabase
- Tengas permisos de administrador
- El archivo SQL esté completo y sin modificaciones
