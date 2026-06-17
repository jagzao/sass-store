# Social Media Module - UX Enhancements

Este documento describe las mejoras de experiencia de usuario implementadas en el módulo de redes sociales.

## 🎯 Características Implementadas (FASE 4)

### 1. Drag & Drop para Reorganizar Posts

**Componentes:**

- `DraggablePostCard.tsx` - Tarjeta individual de post arrastrable
- `DraggableQueue.tsx` - Contenedor con soporte de drag & drop

**Uso:**

```tsx
import DraggableQueue from "@/components/social/DraggableQueue";

<DraggableQueue
  posts={posts}
  onPostClick={(postId) => console.log(postId)}
  onReorder={(newOrder) => {
    // Actualizar orden en el backend
    updatePostOrder(newOrder);
  }}
/>;
```

**Características:**

- Arrastrar y soltar posts para reordenar
- Feedback visual durante el arrastre (opacidad reducida)
- Activación con 8px de movimiento para evitar clics accidentales
- Soporte para teclado (accesibilidad)
- Cursor de "move" para indicar que es arrastrable

**Tecnología:**

- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities

### 2. Media Upload (Placeholder)

**Componente:**

- `MediaUpload.tsx` - UI para cargar imágenes y videos

**Uso:**

```tsx
import MediaUpload from "@/components/social/MediaUpload";

<MediaUpload
  onUpload={(files) => {
    // Subir a S3/Cloudinary
    uploadToCloudStorage(files);
  }}
  maxFiles={10}
  accept="image/*,video/*"
/>;
```

**Características:**

- Drag & drop de archivos
- Click para seleccionar archivos
- Vista previa de imágenes
- Soporte para múltiples archivos
- Indicador de video para archivos MP4
- Botón para eliminar archivos
- Mensaje de "función en desarrollo"

**Estado Actual:**

- ✅ UI completa y funcional
- ⏳ Integración con almacenamiento (S3/Cloudinary) pendiente
- ⏳ Backend para persistir URLs pendiente

### 3. Integraciones Pendientes

#### Almacenamiento de Media

Para implementar en el futuro:

1. **Opción 1: Supabase Storage**

   ```bash
   # Ya usas Supabase, puedes usar su storage
   npm install @supabase/storage-js
   ```

2. **Opción 2: Cloudinary**

   ```bash
   npm install cloudinary
   ```

3. **Opción 3: AWS S3**
   ```bash
   npm install @aws-sdk/client-s3
   ```

#### Endpoint de Upload

Crear en `/api/v1/social/media/upload`:

```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // Upload to cloud storage
  const url = await uploadToStorage(file);

  // Save to database
  const media = await db.insert(mediaAssets).values({
    tenantId,
    url,
    type: file.type,
    size: file.size,
  });

  return NextResponse.json({ url, id: media.id });
}
```

## 🔧 Instalación

Las dependencias ya están instaladas:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## 📖 Ejemplos de Uso

### Integrar Drag & Drop en QueueView

```tsx
// En QueueView.tsx
import DraggableQueue from "@/components/social/DraggableQueue";

export default function QueueView({ tenant, onPostClick }) {
  const [posts, setPosts] = useState([]);

  const handleReorder = async (reorderedPosts) => {
    // Actualizar orden en el backend
    await fetch("/api/v1/social/queue/reorder", {
      method: "POST",
      body: JSON.stringify({
        tenant,
        postIds: reorderedPosts.map((p) => p.id),
      }),
    });
  };

  return (
    <DraggableQueue
      posts={posts}
      onPostClick={onPostClick}
      onReorder={handleReorder}
    />
  );
}
```

### Integrar Media Upload en EditorDrawer

```tsx
// En EditorDrawer.tsx
import MediaUpload from "@/components/social/MediaUpload";

export default function EditorDrawer({ isOpen, postId, onClose }) {
  const handleUpload = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch("/api/v1/social/media/upload", {
      method: "POST",
      body: formData,
    });

    const { urls } = await response.json();
    // Asociar URLs con el post
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      {/* ... otros campos ... */}

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Imágenes y Videos
        </label>
        <MediaUpload onUpload={handleUpload} maxFiles={5} />
      </div>
    </Drawer>
  );
}
```

## 🚀 Próximos Pasos

1. **Implementar backend de reordenamiento**
   - Crear endpoint `/api/v1/social/queue/reorder`
   - Actualizar `scheduledAt` basado en nuevo orden

2. **Implementar upload de media**
   - Elegir proveedor de almacenamiento (Supabase/Cloudinary/S3)
   - Crear endpoint `/api/v1/social/media/upload`
   - Asociar media con posts en la base de datos

3. **Mejorar EditorDrawer**
   - Integrar MediaUpload component
   - Mostrar media asociada con el post
   - Permitir eliminar media

4. **Responsive Design**
   - Optimizar drag & drop para móviles
   - Mejorar layout de media upload en pantallas pequeñas

## 📊 Estado del Proyecto

| Fase   | Estado | Descripción                                      |
| ------ | ------ | ------------------------------------------------ |
| FASE 1 | ✅     | Backend Persistence - APIs conectadas a Supabase |
| FASE 2 | ✅     | AI Content Generation - Claude 3.5 Sonnet        |
| FASE 3 | ✅     | Analytics Visualization - Recharts dashboards    |
| FASE 4 | ✅     | UX Enhancements - Drag & drop + Media upload UI  |

## 🔗 Enlaces Útiles

- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Cloudinary Upload Widget](https://cloudinary.com/documentation/upload_widget)
- [AWS S3 SDK](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-example-creating-buckets.html)
