'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/sw-register';
import { initWebVitals } from '@/lib/web-vitals';
import { startMemoryLeakDetection } from '@/lib/memory-management';

/**
 * Client-side initialization component
 * Handles Service Worker registration, Web Vitals tracking, and memory leak detection
 */
export function ClientInit() {
  useEffect(() => {
    // Register Service Worker for offline support and caching
    registerServiceWorker();

    // Initialize Web Vitals tracking for performance monitoring
    initWebVitals();

    // Start memory leak detection to prevent memory issues
    startMemoryLeakDetection();
  }, []);

  // This component doesn't render anything
  return null;
}
