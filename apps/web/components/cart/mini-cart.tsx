'use client';

import { useState, useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  tenant: string;
}

interface MiniCartProps {
  isVisible: boolean;
  onClose: () => void;
}

export function MiniCart({ isVisible, onClose }: MiniCartProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Mock cart items
  useEffect(() => {
    setItems([
      {
        id: '1',
        name: 'Classic Manicure',
        price: 35.00,
        quantity: 1,
        image: '💅',
        tenant: 'wondernails'
      },
      {
        id: '2',
        name: 'Sunset Orange Polish',
        price: 22.00,
        quantity: 2,
        image: '🧡',
        tenant: 'wondernails'
      }
    ]);
  }, []);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!isVisible && !isOpen) return null;

  return (
    <>
      {/* Sticky Cart Icon */}
      <div className="fixed right-4 bottom-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-colors"
        >
          <div className="relative">
            <span className="text-xl">🛒</span>
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Mini Cart Panel */}
      {isOpen && (
        <div className="fixed right-4 bottom-20 z-40 w-80 bg-white border border-gray-200 rounded-lg shadow-xl">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Carrito ({items.length})</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Tu carrito está vacío
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-2 border border-gray-100 rounded">
                    <span className="text-2xl">{item.image}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.tenant}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-semibold text-red-600">
                          ${item.price}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-xs">
                            -
                          </button>
                          <span className="text-sm">{item.quantity}</span>
                          <button className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded text-xs">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold text-red-600">${total.toFixed(2)}</span>
              </div>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition-colors">
                Proceder al pago (1/3)
              </button>
              <button className="w-full mt-2 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Ver carrito completo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
