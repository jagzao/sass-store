// Lazy loading inteligente con Intersection Observer (gratis)
export function createIntersectionObserver(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
  if (typeof window === 'undefined') return null;

  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px', // Cargar 50px antes de que el elemento sea visible
    threshold: 0.1,
    ...options
  });
}

export function useLazyLoadImages() {
  if (typeof window === 'undefined') return;

  const imageObserver = createIntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;

        if (src) {
          img.src = src;
          img.classList.remove('lazy');
          imageObserver?.unobserve(img);
        }
      }
    });
  });

  // Observar todas las imágenes lazy
  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach(img => imageObserver?.observe(img));

  return () => {
    imageObserver?.disconnect();
  };
}

export function useLazyLoadComponents() {
  if (typeof window === 'undefined') return;

  const componentObserver = createIntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        const componentName = element.dataset.lazyComponent;

        if (componentName) {
          // Aquí se podría implementar carga dinámica de componentes
          // Por ahora solo marcamos como cargado
          element.classList.add('lazy-loaded');
          componentObserver?.unobserve(element);
        }
      }
    });
  });

  // Observar componentes lazy
  const lazyComponents = document.querySelectorAll('[data-lazy-component]');
  lazyComponents.forEach(component => componentObserver?.observe(component));

  return () => {
    componentObserver?.disconnect();
  };
}

// Hook para lazy loading general
export function useLazyLoading() {
  if (typeof window === 'undefined') return;

  const cleanupImages = useLazyLoadImages();
  const cleanupComponents = useLazyLoadComponents();

  return () => {
    cleanupImages?.();
    cleanupComponents?.();
  };
}

// Función para marcar elementos como lazy
export function markAsLazy(element: HTMLElement, dataSrc?: string) {
  element.setAttribute('data-lazy', 'true');
  if (dataSrc) {
    element.setAttribute('data-src', dataSrc);
  }
}