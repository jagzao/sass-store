"use client"; // Client component to handle dynamic cart operations

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LiveRegionProvider } from "@/components/a11y/LiveRegion";
import { useCart } from "@/lib/cart/cart-store";

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenant as string;

  // Use Zustand cart store
  const { items, removeItem, updateQuantity, clearCart } = useCart();

  const [tenantData, setTenantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter items for current tenant
  const cartItems = items.filter((item) => item.variant?.tenant === tenantSlug);

  useEffect(() => {
    // Load tenant data
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

  const handleUpdateQuantity = (sku: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(sku, newQuantity);
  };

  const handleRemoveItem = (sku: string) => {
    removeItem(sku);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + tax;

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

  const branding = tenantData?.branding || { primaryColor: "#4F46E5" };
  const hasServices = tenantData?.services?.length > 0;

  return (
    <LiveRegionProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Simple Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <a
                  href={`/t/${tenantSlug}`}
                  className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
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
              <nav className="flex space-x-4">
                {hasServices && (
                  <a
                    href={`/t/${tenantSlug}/services`}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Servicios
                  </a>
                )}
                <a
                  href={`/t/${tenantSlug}/products`}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Productos
                </a>
                <a
                  href={`/t/${tenantSlug}/login`}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Login
                </a>
              </nav>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Resumen</h2>
              <p className="text-gray-600 mt-2">
                {cartItems.length} artículo(s) en tu carrito
              </p>
            </div>

            {cartItems.length > 0 ? (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="space-y-6">
                        {cartItems.map((item, index) => (
                          <div
                            key={item.sku}
                            className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0"
                          >
                            {/* Item Image */}
                            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                              {item.image}
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium text-gray-900">
                                {item.name}
                              </h3>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {item.variant?.type === "service"
                                    ? "Servicio"
                                    : "Producto"}
                                </span>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.sku,
                                    item.quantity - 1,
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                aria-label="Disminuir cantidad"
                              >
                                -
                              </button>
                              <span
                                className="w-8 text-center"
                                aria-label={`Cantidad: ${item.quantity}`}
                              >
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.sku,
                                    item.quantity + 1,
                                  )
                                }
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                aria-label="Aumentar cantidad"
                              >
                                +
                              </button>
                            </div>

                            {/* Item Price */}
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                $
                                {(Number(item.price) * item.quantity).toFixed(
                                  2,
                                )}
                              </div>
                              {item.quantity > 1 && (
                                <div className="text-sm text-gray-500">
                                  ${Number(item.price).toFixed(2)} c/u
                                </div>
                              )}
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveItem(item.sku)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                              aria-label={`Eliminar ${item.name}`}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Continue Shopping */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <a
                          href={`/t/${tenantSlug}/products`}
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          ← Continuar comprando
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Resumen del Pedido
                    </h2>

                    {/* Summary Lines */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">IVA (16%)</span>
                        <span className="font-medium">${tax.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                      onClick={() => router.push(`/t/${tenantSlug}/checkout`)}
                      className="w-full mt-6 py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity text-white"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      Proceder al Pago
                    </button>

                    {/* Payment Methods */}
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">Aceptamos:</p>
                      <div className="flex justify-center space-x-2 text-2xl">
                        💳 💰 📱
                      </div>
                    </div>

                    {/* Security Badge */}
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center text-sm text-gray-500">
                        🔒 Compra segura y protegida
                      </div>
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Código Promocional
                    </h3>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Ingresa tu código"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty Cart */
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Tu carrito está vacío
                </h3>
                <p className="text-gray-600 mb-6">
                  ¡Agrega algunos productos o servicios para empezar!
                </p>
                <div className="flex justify-center space-x-4">
                  <a
                    href={`/t/${tenantSlug}/products`}
                    className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Ver Productos
                  </a>
                  {hasServices && (
                    <a
                      href={`/t/${tenantSlug}/services`}
                      className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Ver Servicios
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LiveRegionProvider>
  );
}
