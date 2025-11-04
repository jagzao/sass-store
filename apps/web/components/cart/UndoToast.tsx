'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/lib/cart/cart-store';
import gsap from 'gsap';

interface UndoToastProps {
  itemName: string;
  sku: string;
  onClose: () => void;
}

export default function UndoToast({ itemName, sku, onClose }: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(8); // 8 seconds to undo
  const undoRemove = useCart((state) => state.undoRemove);
  const toastRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Slide in animation
    if (toastRef.current) {
      gsap.fromTo(
        toastRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }

    // Progress bar animation
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: '0%',
        duration: 8,
        ease: 'linear'
      });
    }

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    if (toastRef.current) {
      gsap.to(toastRef.current, {
        y: 100,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: onClose
      });
    } else {
      onClose();
    }
  };

  const handleUndo = () => {
    undoRemove(sku);
    handleClose();
  };

  return (
    <div
      ref={toastRef}
      className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white rounded-lg shadow-2xl overflow-hidden max-w-md"
      role="alert"
      aria-live="assertive"
    >
      {/* Progress bar */}
      <div className="h-1 bg-gray-700">
        <div
          ref={progressRef}
          className="h-full bg-blue-500"
          style={{ width: '100%' }}
        />
      </div>

      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium">Producto eliminado</p>
          <p className="text-sm text-gray-600 mt-0.5">{itemName}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium text-sm transition-colors"
            aria-label={`Deshacer eliminación de ${itemName}`}
          >
            Deshacer
          </button>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-4 pb-2 text-xs text-gray-600">
        Se eliminará permanentemente en {timeLeft}s
      </div>
    </div>
  );
}
