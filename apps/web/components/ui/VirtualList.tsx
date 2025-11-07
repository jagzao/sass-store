"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { LazyLoad } from "@/components/ui/LazyLoad";

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
  overscan?: number;
}

/**
 * Componente para listas virtuales que solo renderiza elementos visibles
 */
function VirtualListComponent<T>({
  items,
  renderItem,
  itemHeight = 200,
  containerHeight = 400,
  className = "",
  overscan = 5,
}: VirtualListProps<T>) {
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleEnd, setVisibleEnd] = useState(
    Math.floor(containerHeight / itemHeight) + overscan,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);

    setVisibleStart(start);
    setVisibleEnd(end);
  }, [itemHeight, containerHeight, overscan, items.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    // Ejecutar una vez para establecer el estado inicial
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Calcular altura del espacio en blanco superior
  const topPadding = visibleStart * itemHeight;
  // Calcular altura del espacio en blanco inferior
  const bottomPadding = (items.length - visibleEnd) * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ paddingTop: `${topPadding}px` }} />
      {items.slice(visibleStart, visibleEnd).map((item, index) => (
        <LazyLoad key={`${visibleStart + index}`} height={`${itemHeight}px`}>
          {renderItem(item, visibleStart + index)}
        </LazyLoad>
      ))}
      <div style={{ paddingBottom: `${bottomPadding}px` }} />
    </div>
  );
}

// Export as generic component with memo
export const VirtualList = memo(VirtualListComponent) as <T>(
  props: VirtualListProps<T>,
) => React.ReactElement;

VirtualList.displayName = "VirtualList";
