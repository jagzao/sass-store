"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

/**
 * Live Region Context for Screen Reader Announcements
 *
 * Usage:
 * 1. Wrap your app with <LiveRegionProvider>
 * 2. Use useAnnounce() hook to make announcements
 *
 * Example:
 * const announce = useAnnounce();
 * announce('Producto agregado al carrito', 'polite');
 */

type AnnouncementPriority = 'polite' | 'assertive';

interface Announcement {
  message: string;
  priority: AnnouncementPriority;
  id: number;
}

interface LiveRegionContextType {
  announce: (message: string, priority?: AnnouncementPriority) => void;
}

const LiveRegionContext = createContext<LiveRegionContextType | undefined>(undefined);

export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const idCounter = useRef(0);

  const announce = useCallback((message: string, priority: AnnouncementPriority = 'polite') => {
    const id = Date.now() * 1000 + (++idCounter.current); // Ensures unique ID with high precision

    // Add announcement
    setAnnouncements(prev => [...prev, { message, priority, id }]);

    // Remove after 3 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 3000);
  }, []);

  const politeMessages = announcements.filter(a => a.priority === 'polite');
  const assertiveMessages = announcements.filter(a => a.priority === 'assertive');

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}

      {/* Polite live region - doesn't interrupt */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessages.map(a => (
          <div key={a.id}>{a.message}</div>
        ))}
      </div>

      {/* Assertive live region - interrupts immediately */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessages.map(a => (
          <div key={a.id}>{a.message}</div>
        ))}
      </div>
    </LiveRegionContext.Provider>
  );
}

/**
 * Hook to announce messages to screen readers
 */
export function useAnnounce() {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error('useAnnounce must be used within LiveRegionProvider');
  }
  return context.announce;
}

/**
 * Standalone live region component (for use without provider)
 */
export function LiveRegion({ message, priority = 'polite' }: {
  message: string;
  priority?: AnnouncementPriority;
}) {
  return (
    <div
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
