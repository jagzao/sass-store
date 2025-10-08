"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAnnounce } from "@/components/a11y/LiveRegion";

export interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  primaryColor: string;
  tenantSlug: string;
  metadata?: any;
  onAddToCart?: (productId: string, quantity: number) => void;
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  image,
  category,
  primaryColor,
  tenantSlug,
  metadata,
  onAddToCart
}: ProductCardProps) {
  const router = useRouter();
  const announce = useAnnounce();
  const [quantity, setQuantity] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(q => q + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(q => Math.max(0, q - 1));
  };

  const handleComprarAhora = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity === 0) {
      announce('Por favor selecciona una cantidad', 'assertive');
      alert('Por favor selecciona una cantidad');
      return;
    }
    // Add to cart and navigate
    if (onAddToCart) {
      onAddToCart(id, quantity);
    }
    announce(`${quantity} ${name} agregado al carrito`, 'polite');
    router.push(`/t/${tenantSlug}/cart`);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setQuantity(Math.max(0, value));
  };

  const handleImageClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image - clickable for details */}
        <div
          className="p-6 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={handleImageClick}
        >
          <div className="text-5xl mb-4 text-center" role="img" aria-label={`Imagen de ${name}`}>
            {image || metadata?.image || '📦'}
          </div>
          <h3 className="text-xl font-semibold mb-2">{name}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>

          <div className="flex justify-between items-center mb-4">
            <span className="text-2xl font-bold" style={{ color: primaryColor }}>
              ${price}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
              {category?.replace('-', ' ') || metadata?.category?.replace('-', ' ') || 'general'}
            </span>
          </div>
        </div>

        {/* Quantity Controls + Buttons */}
        <div className="px-6 pb-6">
          {/* Quantity Control */}
          <div className="flex items-center justify-center mb-3 gap-3">
            <button
              onClick={handleDecrement}
              className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors font-bold text-lg"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-16 text-center font-semibold text-lg border-2 border-gray-200 rounded px-2 py-1 focus:border-gray-400 focus:outline-none"
              min="0"
              aria-label="Quantity"
            />
            <button
              onClick={handleIncrement}
              className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors font-bold text-lg"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Action Button - Solo "Comprar ahora" */}
          <button
            onClick={handleComprarAhora}
            className="w-full py-3 px-6 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Comprar ahora
          </button>
        </div>
      </div>

      {/* Product Detail Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8">
              {/* Close button */}
              <button
                onClick={() => setShowModal(false)}
                className="float-right text-gray-600 hover:text-gray-600 text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>

              <div className="text-7xl mb-6 text-center" role="img" aria-label={`Imagen de ${name}`}>
                {image || metadata?.image || '📦'}
              </div>

              <h2 className="text-3xl font-bold mb-4">{name}</h2>

              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ color: primaryColor }}>
                  ${price}
                </span>
                <span className="text-sm text-gray-500 ml-2">MXN</span>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Descripción</h3>
                <p className="text-gray-600 leading-relaxed">{description}</p>
              </div>

              {metadata && Object.keys(metadata).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Detalles</h3>
                  <dl className="grid grid-cols-2 gap-3">
                    {Object.entries(metadata).map(([key, value]) => (
                      key !== 'image' && (
                        <div key={key}>
                          <dt className="text-sm font-medium text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </dt>
                          <dd className="text-sm text-gray-900">{String(value)}</dd>
                        </div>
                      )
                    ))}
                  </dl>
                </div>
              )}

              {/* Quantity Control in Modal */}
              <div className="flex items-center justify-center mb-6 gap-4">
                <button
                  onClick={handleDecrement}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors font-bold text-xl"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-20 text-center font-bold text-2xl border-2 border-gray-200 rounded px-2 py-1 focus:border-gray-400 focus:outline-none"
                  min="0"
                  aria-label="Quantity"
                />
                <button
                  onClick={handleIncrement}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors font-bold text-xl"
                >
                  +
                </button>
              </div>

              {/* Action Button - Solo "Comprar ahora" */}
              <button
                onClick={handleComprarAhora}
                className="w-full py-4 px-6 rounded-lg text-white font-bold hover:opacity-90 transition-opacity shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                Comprar ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
