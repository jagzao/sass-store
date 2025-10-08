'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // During static generation, return no-op functions
    return {
      toasts: [],
      showToast: () => {},
      removeToast: () => {}
    };
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 5000) => {
    const id = crypto.randomUUID().replace(/-/g, '').substring(0, 9);
    const toast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Listen to global cart events only after mounting
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const handleCartUpdate = (event: any) => {
      showToast(`✅ ${event.detail.item} agregado al carrito`, 'success');
    };

    const handleCartError = (event: any) => {
      showToast(`❌ ${event.detail.message}`, 'error');
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('cart-error', handleCartError);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('cart-error', handleCartError);
    };
  }, [showToast, mounted]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {mounted && <ToastContainer toasts={toasts} removeToast={removeToast} />}
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onRemove, 300); // Wait for animation
  };

  const getToastStyles = () => {
    const baseStyles = "flex items-center p-4 rounded-lg shadow-lg min-w-[300px] max-w-[400px] transition-all duration-300 transform";

    const typeStyles = {
      success: "bg-green-50 border-l-4 border-green-400 text-green-800",
      error: "bg-red-50 border-l-4 border-red-400 text-red-800",
      warning: "bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800",
      info: "bg-blue-50 border-l-4 border-blue-400 text-blue-800"
    };

    const animationStyles = isVisible
      ? "translate-x-0 opacity-100"
      : "translate-x-full opacity-0";

    return `${baseStyles} ${typeStyles[toast.type]} ${animationStyles}`;
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  return (
    <div className={getToastStyles()}>
      <span className="text-xl mr-3">{getIcon()}</span>
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={handleClose}
        className="ml-3 text-gray-600 hover:text-gray-600 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}