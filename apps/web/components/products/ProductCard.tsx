/* eslint-disable no-undef */
'use client';

import React, { useState, useRef, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { useAnnounce } from "@/components/a11y/LiveRegion";
import { useCart } from "@/lib/cart/cart-store";

interface ProductMetadata {
  image?: string;
  category?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  primaryColor: string;
  tenantSlug: string;
  metadata?: ProductMetadata;
  onAddToCart?: (productId: string, quantity: number) => void;
  variant?: 'default' | 'luxury';
}

const ProductCard = memo(function ProductCard({
  id,
  name,
  description,
  price,
  image,
  category,
  primaryColor,
  tenantSlug,
  metadata,
  onAddToCart,
  variant = 'default'
}: ProductCardProps) {
  const router = useRouter();
  const announce = useAnnounce();
  const { items, updateQuantity, addItem, removeItem } = useCart();

  // Get current quantity from cart
  const cartItem = items.find(item => item.sku === id);
  const [localQuantity, setLocalQuantity] = useState(cartItem?.quantity || 0);
  const [showModal, setShowModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const addTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local quantity with cart
  useEffect(() => {
    const itemInCart = items.find(item => item.sku === id);
    setLocalQuantity(itemInCart?.quantity || 0);
  }, [items, id]);

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newQuantity = localQuantity + 1;
    setLocalQuantity(newQuantity);

    // Update cart in real-time
    if (cartItem) {
      updateQuantity(id, newQuantity);
    } else {
      // Add to cart with quantity 1
      addItem({
        sku: id,
        name,
        price: Number(price), // Ensure price is a number
        image: image || metadata?.image || '📦',
        variant: {
          tenant: tenantSlug,
          type: 'product'
        }
      }, 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newQuantity = Math.max(0, localQuantity - 1);
    setLocalQuantity(newQuantity);

    // Update cart in real-time
    if (newQuantity === 0) {
      removeItem(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleComprarAhora = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Prevent double-click
    if (isAdding) return;

    // Si la cantidad es 0, agregar automáticamente 1 item
    if (localQuantity === 0) {
      const newQuantity = 1;
      setLocalQuantity(newQuantity);

      // Add to cart
      addItem({
        sku: id,
        name,
        price: Number(price),
        image: image || metadata?.image || '📦',
        variant: {
          tenant: tenantSlug,
          type: 'product'
        }
      }, newQuantity);

      announce(`Agregado ${newQuantity} ${name} al carrito`, 'polite');
    }

    // Set adding state to prevent double-click
    setIsAdding(true);

    const finalQuantity = localQuantity === 0 ? 1 : localQuantity;
    announce(`Ir al carrito con ${finalQuantity} ${name}`, 'polite');

    // Navigate to cart (items already added via increment/decrement or just added above)
    addTimeoutRef.current = setTimeout(() => {
      router.push(`/t/${tenantSlug}/cart`);
      setIsAdding(false);
    }, 100);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const newQuantity = Math.max(0, value);
    setLocalQuantity(newQuantity);

    // Update cart in real-time
    if (newQuantity === 0) {
      if (cartItem) removeItem(id);
    } else if (cartItem) {
      updateQuantity(id, newQuantity);
    } else {
      addItem({
        sku: id,
        name,
        price: Number(price), // Ensure price is a number
        image: image || metadata?.image || '📦',
        variant: {
          tenant: tenantSlug,
          type: 'product'
        }
      }, newQuantity);
    }
  };

  const handleImageClick = () => {
    setShowModal(true);
  };

  const isLuxury = variant === 'luxury';

  return (
    <>
      <div 
        data-testid="product-card" 
        className={`rounded-lg overflow-hidden transition-all duration-300 ${
          isLuxury 
            ? 'bg-[#1a1a1a]/60 backdrop-blur-md border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)]' 
            : 'bg-white shadow-md hover:shadow-lg'
        }`}
      >
        {/* Image - clickable for details */}
        <div
          className="p-6 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={handleImageClick}
        >
          <div className="text-5xl mb-4 text-center" role="img" aria-label={`Imagen de ${name}`}>
            {image || metadata?.image || (isLuxury ? '' : '📦')}
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${isLuxury ? 'text-[#D4AF37] font-serif tracking-wide' : ''}`}>
            {name}
          </h3>
          <p className={`text-sm mb-4 line-clamp-2 ${isLuxury ? 'text-gray-300 font-light' : 'text-gray-600'}`}>
            {description}
          </p>

          <div className="flex justify-between items-center mb-4">
            <span className={`text-2xl font-bold ${isLuxury ? 'text-white' : ''}`} style={!isLuxury ? { color: primaryColor } : undefined}>
              ${price}
            </span>
            <span className={`text-xs px-2 py-1 rounded capitalize ${
              isLuxury 
                ? 'text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20' 
                : 'text-gray-500 bg-gray-100'
            }`}>
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
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors font-bold text-lg ${
                isLuxury 
                  ? 'border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10' 
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              value={localQuantity}
              onChange={handleQuantityChange}
              className={`w-16 text-center font-semibold text-lg border-2 rounded px-2 py-1 focus:outline-none ${
                isLuxury
                  ? 'bg-transparent border-[#D4AF37]/30 text-white focus:border-[#D4AF37]'
                  : 'border-gray-200 focus:border-gray-400'
              }`}
              min="0"
              aria-label="Quantity"
            />
            <button
              onClick={handleIncrement}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors font-bold text-lg ${
                isLuxury 
                  ? 'border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10' 
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Action Button - Solo "Comprar ahora" */}
          <button
            data-testid="add-to-cart-btn"
            onClick={handleComprarAhora}
            disabled={isAdding}
            className={`w-full py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed ${
              isLuxury ? 'text-[#121212]' : 'text-white'
            }`}
            style={{ backgroundColor: isLuxury ? '#D4AF37' : primaryColor }}
          >
            {isAdding ? 'Agregando...' : 'Comprar ahora'}
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
                  value={localQuantity}
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
                data-testid="add-to-cart-btn"
                onClick={handleComprarAhora}
                disabled={isAdding}
                className="w-full py-4 px-6 rounded-lg text-white font-bold hover:opacity-90 transition-opacity shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
              >
                {isAdding ? 'Agregando...' : 'Comprar ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;