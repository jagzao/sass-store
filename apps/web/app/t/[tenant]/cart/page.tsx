"use client";

import React, { useEffect, useState, useRef, memo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { LiveRegionProvider, useAnnounce } from "@/components/a11y/LiveRegion";
import { useCart } from "@/lib/cart/cart-store";
import CartBadge from "@/components/cart/CartBadge";
import UndoToast from "@/components/cart/UndoToast";
import gsap from "gsap";

// Memoized Cart Item Component for performance
const CartItem = memo(({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  primaryColor
}: {
  item: any;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  primaryColor: string;
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const quantityRef = useRef<HTMLSpanElement>(null);
  const prevQuantity = useRef(item.quantity);
  const prevPrice = useRef(item.price * item.quantity);

  useEffect(() => {
    // Animate on mount
    if (itemRef.current) {
      gsap.fromTo(
        itemRef.current,
        { opacity: 0, y: 12, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.22,
          ease: 'power2.out'
        }
      );
    }
  }, []);

  useEffect(() => {
    // Animate quantity changes with tick effect
    if (quantityRef.current && item.quantity !== prevQuantity.current) {
      gsap.timeline()
        .to(quantityRef.current, {
          scale: 0.95,
          duration: 0.08
        })
        .to(quantityRef.current, {
          scale: 1,
          duration: 0.12,
          ease: 'back.out(1.7)'
        });
      prevQuantity.current = item.quantity;
    }

    // Animate price changes with number counter
    const currentPrice = item.price * item.quantity;
    if (priceRef.current && currentPrice !== prevPrice.current) {
      const startValue = prevPrice.current;
      const diff = currentPrice - startValue;

      gsap.to({ val: 0 }, {
        val: diff,
        duration: 0.25,
        ease: 'power2.out',
        onUpdate: function() {
          if (priceRef.current) {
            const newValue = startValue + this.targets()[0].val;
            priceRef.current.textContent = `$${newValue.toFixed(2)}`;
          }
        }
      });

      // Flash background
      gsap.timeline()
        .to(priceRef.current, {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          duration: 0.1
        })
        .to(priceRef.current, {
          backgroundColor: 'transparent',
          duration: 0.15
        });

      prevPrice.current = currentPrice;
    }
  }, [item.quantity, item.price]);

  const handleRemove = () => {
    // Stagger animation before removal
    if (itemRef.current) {
      const children = itemRef.current.children;
      gsap.timeline()
        .to(Array.from(children), {
          opacity: 0,
          x: -20,
          duration: 0.14,
          stagger: 0.02,
          ease: 'power2.in'
        })
        .to(itemRef.current, {
          height: 0,
          marginBottom: 0,
          paddingTop: 0,
          paddingBottom: 0,
          duration: 0.2,
          ease: 'power2.inOut',
          onComplete: onRemove
        });
    } else {
      onRemove();
    }
  };

  return (
    <div
      ref={itemRef}
      data-testid="cart-item"
      className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-b-0"
      role="article"
      aria-label={`${item.name}, cantidad: ${item.quantity}`}
    >
      {/* Image */}
      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
        {item.image}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-medium text-gray-900 truncate">
          {item.name}
        </h3>
        {item.variant?.type && (
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {item.variant.type === 'service' ? 'Servicio' : 'Producto'}
          </span>
        )}
        {item.error && (
          <div
            className="mt-1 text-sm text-red-600 font-medium"
            role="alert"
            aria-live="assertive"
          >
            ⚠️ {item.error}
          </div>
        )}
        <div className="text-sm text-gray-500 mt-1">
          ${Number(item.price).toFixed(2)} c/u
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onDecrement}
          className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label={`Disminuir cantidad de ${item.name}`}
        >
          <span className="text-lg font-bold">−</span>
        </button>
        <span
          ref={quantityRef}
          className="w-10 text-center font-semibold text-lg"
          aria-live="polite"
          aria-label={`Cantidad: ${item.quantity}`}
        >
          {item.quantity}
        </span>
        <button
          onClick={onIncrement}
          className="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label={`Aumentar cantidad de ${item.name}`}
        >
          <span className="text-lg font-bold">+</span>
        </button>
      </div>

      {/* Price */}
      <div
        ref={priceRef}
        className="text-right font-semibold text-lg text-gray-900 min-w-[80px] px-2 py-1 rounded transition-colors"
      >
        ${(Number(item.price) * item.quantity).toFixed(2)}
      </div>

      {/* Remove */}
      <button
        onClick={handleRemove}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
        style={{ minWidth: '44px', minHeight: '44px' }}
        aria-label={`Eliminar ${item.name} del carrito`}
      >
        <span className="text-xl">🗑️</span>
      </button>
    </div>
  );
});

CartItem.displayName = 'CartItem';

// Inner Cart Component (uses useAnnounce which requires LiveRegionProvider)
function CartPageInner({ tenantSlug, tenantData, loading }: {
  tenantSlug: string;
  tenantData: any;
  loading: boolean;
}) {
  const router = useRouter();
  const announce = useAnnounce();

  const {
    items,
    deletedItems,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    hasErrors,
    getSubtotal,
    getDiscount,
    getTax,
    getShipping,
    getTotal,
    _deduplicateItems,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [undoItem, setUndoItem] = useState<{ name: string; sku: string } | null>(null);
  const [isCheckoutDisabled, setIsCheckoutDisabled] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const subtotalRef = useRef<HTMLDivElement>(null);
  const discountRef = useRef<HTMLDivElement>(null);
  const totalRef = useRef<HTMLDivElement>(null);

  // Filter items for current tenant and deduplicate
  const cartItems = React.useMemo(() => {
    const tenantItems = items.filter((item) => item.variant?.tenant === tenantSlug);
    const deduped = _deduplicateItems(tenantItems);

    // Log if we found duplicates
    if (deduped.length < tenantItems.length) {
      console.warn(`[CART] Deduplicados ${tenantItems.length - deduped.length} items duplicados`);
    }

    return deduped;
  }, [items, tenantSlug, _deduplicateItems]);

  // Monitor deleted items for undo
  useEffect(() => {
    if (deletedItems.length > 0) {
      const latest = deletedItems[deletedItems.length - 1];
      const tenantItem = latest.variant?.tenant === tenantSlug;
      if (tenantItem) {
        setUndoItem({ name: latest.name, sku: latest.sku });
      }
    }
  }, [deletedItems, tenantSlug]);

  // Animate totals on change
  useEffect(() => {
    const animateValue = (ref: React.RefObject<HTMLDivElement>, newValue: number) => {
      if (!ref.current) return;

      const currentText = ref.current.textContent || '$0.00';
      const currentValue = parseFloat(currentText.replace(/[^0-9.-]+/g, ''));

      if (currentValue === newValue) return;

      gsap.to({ val: currentValue }, {
        val: newValue,
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: function() {
          if (ref.current) {
            ref.current.textContent = `$${this.targets()[0].val.toFixed(2)}`;
          }
        }
      });

      // Subtle flash
      gsap.timeline()
        .to(ref.current, {
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          duration: 0.08
        })
        .to(ref.current, {
          backgroundColor: 'transparent',
          duration: 0.12
        });
    };

    if (cartItems.length > 0) {
      animateValue(subtotalRef, getSubtotal());
      if (appliedCoupon) animateValue(discountRef, getDiscount());
      animateValue(totalRef, getTotal());
    }
  }, [cartItems, appliedCoupon, getSubtotal, getDiscount, getTotal]);

  // Check for errors to disable checkout
  useEffect(() => {
    setIsCheckoutDisabled(hasErrors() || cartItems.length === 0);
  }, [cartItems, hasErrors]);

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      announce('Por favor ingresa un código de cupón', 'assertive');
      return;
    }

    setIsApplyingCoupon(true);
    await applyCoupon(couponCode);
    setIsApplyingCoupon(false);

    if (!couponError) {
      announce(`Cupón ${couponCode} aplicado exitosamente`, 'polite');
      setCouponCode('');
    } else {
      announce(couponError, 'assertive');
    }
  }, [couponCode, applyCoupon, couponError, announce]);

  const handleCheckout = useCallback(() => {
    if (isCheckoutDisabled) {
      if (cartItems.length === 0) {
        announce('Tu carrito está vacío', 'assertive');
      } else if (hasErrors()) {
        announce('Por favor corrige los errores antes de continuar', 'assertive');
      }
      return;
    }

    // Prevent double-click
    setIsCheckoutDisabled(true);
    router.push(`/t/${tenantSlug}/checkout`);
  }, [isCheckoutDisabled, cartItems, hasErrors, router, tenantSlug, announce]);

  const branding = tenantData?.branding || { primaryColor: "#4F46E5" };
  const hasServices = tenantData?.services?.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <a
                  href={`/t/${tenantSlug}`}
                  className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  ← Volver a {tenantData?.name || "Tienda"}
                </a>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: branding.primaryColor }}
                >
                  Mi Carrito
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <CartBadge tenantSlug={tenantSlug} primaryColor={branding.primaryColor} />
                <nav className="flex gap-3" aria-label="Navegación principal">
                  {hasServices && (
                    <a
                      href={`/t/${tenantSlug}/services`}
                      className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                    >
                      Servicios
                    </a>
                  )}
                  <a
                    href={`/t/${tenantSlug}/products`}
                    className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  >
                    Productos
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 pb-32 md:pb-8">
          {cartItems.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Resumen
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {cartItems.length} {cartItems.length === 1 ? 'artículo' : 'artículos'}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6 space-y-2">
                    {cartItems.map((item, index) => (
                      <CartItem
                        key={`${item.sku}-${index}`}
                        item={item}
                        onIncrement={() => incrementQuantity(item.sku)}
                        onDecrement={() => decrementQuantity(item.sku)}
                        onRemove={() => removeItem(item.sku)}
                        primaryColor={branding.primaryColor}
                      />
                    ))}
                  </div>

                  <div className="px-6 pb-6 pt-4 border-t border-gray-200">
                    <a
                      href={`/t/${tenantSlug}/products`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      ← Continuar comprando
                    </a>
                  </div>
                </div>
              </div>

              {/* Summary Sidebar */}
              <div className="lg:col-span-1">
                <div ref={summaryRef} className="space-y-6">
                  {/* Order Summary */}
                  <div className="bg-white rounded-xl shadow-md p-6 lg:sticky lg:top-24">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Resumen del Pedido
                    </h2>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>
                        <span
                          ref={subtotalRef}
                          className="font-medium px-2 py-1 rounded"
                        >
                          ${getSubtotal().toFixed(2)}
                        </span>
                      </div>

                      {appliedCoupon && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Descuento ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.discount}%` : `$${appliedCoupon.discount}`})</span>
                          <span
                            ref={discountRef}
                            className="font-medium px-2 py-1 rounded"
                          >
                            -${getDiscount().toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          Envío {getShipping() === 0 && (
                            <span className="text-green-600 text-xs ml-1">¡Gratis!</span>
                          )}
                        </span>
                        <span className="font-medium">
                          {getShipping() === 0 ? 'Gratis' : `$${getShipping().toFixed(2)}`}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>IVA (16%)</span>
                        <span>${getTax().toFixed(2)}</span>
                      </div>

                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="flex justify-between items-center text-xl font-bold">
                          <span>Total</span>
                          <span
                            ref={totalRef}
                            className="px-2 py-1 rounded"
                            style={{ color: branding.primaryColor }}
                          >
                            ${getTotal().toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">MXN</p>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={isCheckoutDisabled}
                      className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isCheckoutDisabled ? '#9CA3AF' : branding.primaryColor,
                        boxShadow: !isCheckoutDisabled ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                      }}
                      aria-label="Proceder al pago"
                    >
                      {isCheckoutDisabled && hasErrors() ? '⚠️ Corrige errores' : isCheckoutDisabled && cartItems.length === 0 ? 'Carrito vacío' : 'Proceder al Pago'}
                    </button>

                    <div className="mt-4 text-center text-sm text-gray-500">
                      <p className="mb-2">Aceptamos:</p>
                      <div className="flex justify-center gap-2 text-2xl">
                        💳 💰 📱
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center text-sm text-gray-500">
                        🔒 Compra segura y protegida
                      </div>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Código Promocional
                    </h3>

                    {appliedCoupon ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-green-900">
                              ✓ {appliedCoupon.code}
                            </p>
                            <p className="text-sm text-green-700">
                              Cupón aplicado exitosamente
                            </p>
                          </div>
                          <button
                            onClick={removeCoupon}
                            className="text-red-600 hover:text-red-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            placeholder="Ingresa tu código"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            aria-label="Código promocional"
                            disabled={isApplyingCoupon}
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={isApplyingCoupon || !couponCode.trim()}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            style={{ minWidth: '80px' }}
                          >
                            {isApplyingCoupon ? '...' : 'Aplicar'}
                          </button>
                        </div>

                        {couponError && (
                          <div
                            className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700"
                            role="alert"
                          >
                            ❌ {couponError}
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500">
                          <p>Cupones de prueba:</p>
                          <p className="mt-1">
                            <code className="bg-gray-100 px-2 py-1 rounded">SAVE10</code> - 10% descuento<br/>
                            <code className="bg-gray-100 px-2 py-1 rounded">FLAT50</code> - $50 MXN descuento<br/>
                            <code className="bg-gray-100 px-2 py-1 rounded">WELCOME20</code> - 20% descuento
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty Cart */
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-7xl mb-6">🛒</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Tu carrito está vacío
              </h2>
              <p className="text-gray-600 mb-8">
                ¡Explora nuestros productos y servicios para empezar a comprar!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href={`/t/${tenantSlug}/products`}
                  className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Ver Productos
                </a>
                {hasServices && (
                  <a
                    href={`/t/${tenantSlug}/services`}
                    className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Ver Servicios
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Sticky Footer */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4 md:hidden z-20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold" style={{ color: branding.primaryColor }}>
                  ${getTotal().toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isCheckoutDisabled}
                className="px-8 py-3 rounded-lg font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isCheckoutDisabled ? '#9CA3AF' : branding.primaryColor,
                  minHeight: '44px'
                }}
              >
                {isCheckoutDisabled && hasErrors() ? '⚠️ Errores' : 'Pagar'}
              </button>
            </div>
            {hasErrors() && (
              <p className="text-xs text-red-600 text-center">
                Corrige los errores antes de continuar
              </p>
            )}
          </div>
        )}

        {/* Undo Toast */}
        {undoItem && (
          <UndoToast
            itemName={undoItem.name}
            sku={undoItem.sku}
            onClose={() => setUndoItem(null)}
          />
        )}
    </div>
  );
}

// Main Cart Page Component (outer wrapper)
export default function CartPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const [tenantData, setTenantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTenantData = async () => {
      try {
        const response = await fetch(`/api/tenants/${tenantSlug}`);
        if (response.ok) {
          const data = await response.json();
          setTenantData(data);
        }
      } catch (error) {
        console.error("Error loading tenant data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTenantData();
  }, [tenantSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveRegionProvider>
      <CartPageInner
        tenantSlug={tenantSlug}
        tenantData={tenantData}
        loading={loading}
      />
    </LiveRegionProvider>
  );
}
