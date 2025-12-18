# Mejoras en el Carrusel Móvil

## Resumen

Este documento describe las mejoras implementadas en el carrusel del home para mejorar la experiencia de usuario en dispositivos móviles. Las mejoras incluyen:

1. Implementación de gestos táctiles (swipe) para navegar entre productos
2. Hacer el área de la imagen clicable para agregar al carrito o reservar servicios

## Cambios Realizados

### 1. Gestos Táctiles (Swipe) en el Carrusel

#### Archivo Modificado: `apps/web/components/tenant/wondernails/hero/HeroWondernailsFinal.tsx`

**Cambios:**

- Se agregaron estados para manejar los gestos táctiles: `touchStart` y `touchEnd`
- Se implementaron tres funciones para manejar los eventos táctiles:
  - `handleTouchStart`: Registra la posición inicial del toque
  - `handleTouchMove`: Registra la posición durante el movimiento del toque
  - `handleTouchEnd`: Detecta la dirección del swipe y navega al producto anterior o siguiente
- Se agregaron los manejadores de eventos táctiles al componente principal:
  - `onTouchStart={handleTouchStart}`
  - `onTouchMove={handleTouchMove}`
  - `onTouchEnd={handleTouchEnd}`

**Funcionamiento:**

- Cuando un usuario desliza el dedo de derecha a izquierda (distancia > 50px), se navega al siguiente producto
- Cuando un usuario desliza el dedo de izquierda a derecha (distancia < -50px), se navega al producto anterior
- La funcionalidad funciona tanto en la vista principal del carrusel como en la vista de detalle

### 2. Área de Imagen Clicable

#### Archivo Modificado: `apps/web/components/tenant/wondernails/hero/CarouselItem.tsx`

**Cambios:**

- Se importó `useCallback` para optimizar el manejo de eventos
- Se implementó la función `handleImageClick` que:
  - Para productos: llama a `onAddToCart()`
  - Para servicios: llama a `onCheckout()`
- Se modificó el contenedor de la imagen para que sea interactivo:
  - Se agregó la clase `clickableImgWrap` para estilos
  - Se agregaron atributos de accesibilidad: `role="button"`, `tabIndex={0}`, y `aria-label`
  - Se agregó un manejador de eventos `onClick` y `onKeyDown` para accesibilidad
- Se agregó una superposición con texto que aparece al pasar el cursor sobre la imagen:
  - Muestra "COMPRAR" para productos y "RESERVAR" para servicios
  - La superposición tiene efectos de transición suaves

### 3. Actualización de Estilos CSS

#### Archivo Modificado: `apps/web/components/tenant/wondernails/hero/HeroWondernailsGSAP.module.css`

**Cambios:**

- Se agregaron nuevas clases CSS para soportar la funcionalidad de imagen clicable:
  - `.clickableImgWrap`: Hace la imagen interactiva con cursor de puntero
  - `.imgOverlay`: Capa de superposición que aparece al hacer hover
  - `.imgOverlayText`: Texto que se muestra en la superposición
- Se implementaron efectos de hover:
  - La imagen se vuelve ligeramente más brillante al pasar el cursor
  - La superposición aparece con un fondo semitransparente
  - El texto aparece con una animación suave desde abajo
- Se actualizaron los estilos responsivos para asegurar que la funcionalidad se vea bien en dispositivos móviles

### 4. Pruebas Automatizadas

#### Archivo Creado: `tests/e2e/mobile-carousel-swipe.spec.ts`

**Características:**

- Pruebas para validar la funcionalidad de swipe en dispositivos móviles
- Pruebas para validar que al hacer clic en la imagen se agregue el producto al carrito o se reserve el servicio
- Pruebas para verificar que aparezca el texto de superposición al hacer hover
- Pruebas en diferentes dispositivos móviles (iPhone 12, Samsung Galaxy S21, iPad Mini)

**Casos de Prueba:**

1. `should swipe left to navigate to next product`: Verifica que al deslizar a la izquierda se navegue al siguiente producto
2. `should swipe right to navigate to previous product`: Verifica que al deslizar a la derecha se navegue al producto anterior
3. `should be able to click on image to add product to cart`: Verifica que al hacer clic en la imagen de un producto se agregue al carrito
4. `should be able to click on image to reserve service`: Verifica que al hacer clic en la imagen de un servicio se inicie el proceso de reserva
5. `should show overlay text on image hover`: Verifica que aparezca el texto de superposición al hacer hover
6. Pruebas multi-dispositivo para asegurar compatibilidad

## Instrucciones de Uso

### Para Desarrolladores

1. **Implementar gestos táctiles en otros carruseles:**
   - Copiar la implementación de `handleTouchStart`, `handleTouchMove` y `handleTouchEnd`
   - Asegurarse de que el contenedor tenga los manejadores de eventos táctiles
   - Ajustar el umbral de distancia (50px) según sea necesario

2. **Hacer imágenes clicables:**
   - Agregar la clase `clickableImgWrap` al contenedor de la imagen
   - Implementar un manejador de clic que llame a la función adecuada según el tipo de elemento
   - Agregar una superposición con texto para mejorar la experiencia de usuario

### Para Testers

1. **Probar la funcionalidad de swipe:**
   - Abrir la aplicación en un dispositivo móvil o emulador
   - Deslizar el dedo horizontalmente sobre el carrusel
   - Verificar que la navegación sea suave y precisa

2. **Probar la funcionalidad de imagen clicable:**
   - Hacer clic en las imágenes de productos y servicios
   - Verificar que se agreguen al carrito o se inicie el proceso de reserva
   - Verificar que aparezca el texto de superposición al pasar el cursor

## Consideraciones de Accesibilidad

- Se agregaron atributos ARIA para que los usuarios de lectores de pantalla puedan identificar las imágenes como elementos interactivos
- Se implementó navegación por teclado para las imágenes clicable
- Se proporcionaron etiquetas descriptivas para las acciones (agregar al carrito, reservar servicio)

## Compatibilidad

- La funcionalidad de swipe funciona en todos los dispositivos móviles modernos
- Los estilos están optimizados para pantallas táctiles
- Las pruebas cubren una gama amplia de dispositivos y tamaños de pantalla

## Futuras Mejoras

1. **Personalización de la sensibilidad del swipe:**
   - Permitir ajustar la distancia mínima para considerar un swipe válido
   - Añadir configuración para la velocidad del swipe

2. **Más efectos visuales:**
   - Implementar un indicador visual durante el gesto de swipe
   - Añadir animaciones más elaboradas para la superposición

3. **Soporte para más gestos:**
   - Implementar pinch-to-zoom para las imágenes
   - Añadir soporte para gestos de dos dedos

## Conclusión

Estas mejoras significativamente la experiencia de usuario en dispositivos móviles, haciendo que el carrusel sea más intuitivo y fácil de usar. Los usuarios ahora pueden navegar entre productos con gestos naturales y agregar productos al carrito o reservar servicios con un solo toque.
