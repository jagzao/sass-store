'use client';

import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

const toasts: Toast[] = [];

export function Toaster() {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    setToastList(toasts);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toastList.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border p-4 shadow-lg ${
            toast.variant === 'destructive'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-background text-foreground'
          }`}
        >
          <div className="font-semibold">{toast.title}</div>
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function toast(toast: Omit<Toast, 'id'>) {
  const id = crypto.randomUUID().replace(/-/g, '').substring(0, 9);
  toasts.push({ ...toast, id });

  // Auto-remove after 5 seconds
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
    }
  }, 5000);
}