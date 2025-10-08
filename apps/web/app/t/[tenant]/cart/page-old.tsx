import { notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolver";
import { getTenantDataForPage } from "@/lib/db/tenant-service";

interface PageProps {
  params: {
    tenant: string;
  };
}

export default async function CartPage({ params }: PageProps) {
  // Resolve tenant to ensure it exists and is valid
  const resolvedTenant = await resolveTenant();

  if (!resolvedTenant) {
    notFound();
  }

  // Fetch tenant data from database
  const tenantData = await getTenantDataForPage(params.tenant);

  // Mock cart data - in production this would come from database/session
  const mockCart = {
    items: [
      {
        id: "wn-gel-manicure",
        type: "service",
        name: "Gel Manicure",
        price: 55.0,
        quantity: 1,
        image: "✨",
        description: "Long-lasting gel polish manicure",
        duration: 60,
      },
      {
        id: "wn-polish-sunset",
        type: "product",
        name: "Sunset Orange Polish",
        price: 22.0,
        quantity: 2,
        image: "🧡",
        description: "Vibrant orange nail polish with high-gloss finish",
      },
    ],
  };

  const subtotal = mockCart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const branding = tenantData.branding as any;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a
                href={`/t/${params.tenant}`}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Volver a {tenantData.name}
              </a>
              <h1
                className="text-2xl font-bold"
                style={{ color: branding.primaryColor }}
              >
                Mi Carrito
              </h1>
            </div>
            <nav className="flex space-x-4">
              <a
                href={`/t/${params.tenant}/services`}
                className="text-gray-600 hover:text-gray-900"
              >
                Servicios
              </a>
              <a
                href={`/t/${params.tenant}/products`}
                className="text-gray-600 hover:text-gray-900"
              >
                Productos
              </a>
              <a
                href={`/t/${params.tenant}/login`}
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
            <h1 className="text-3xl font-bold text-gray-900">Mi Carrito</h1>
            <p className="text-gray-600 mt-2">
              {mockCart.items.length} artículo(s) en tu carrito
            </p>
          </div>

          {mockCart.items.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="space-y-6">
                      {mockCart.items.map((item, index) => (
                        <div
                          key={item.id}
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
                            <p className="text-sm text-gray-500">
                              {item.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {item.type === "service"
                                  ? "Servicio"
                                  : "Producto"}
                              </span>
                              {item.duration && (
                                <span className="text-sm text-gray-500">
                                  {item.duration} min
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-2">
                            <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                              -
                            </button>
                            <span className="w-8 text-center">
                              {item.quantity}
                            </span>
                            <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                              +
                            </button>
                          </div>

                          {/* Item Price */}
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-sm text-gray-500">
                                ${item.price.toFixed(2)} c/u
                              </div>
                            )}
                          </div>

                          {/* Remove Button */}
                          <button
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Continue Shopping */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <a
                        href={`/t/${params.tenant}/products`}
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
                      <span className="text-gray-600">Impuestos</span>
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
                  <button className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
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
                  href={`/t/${params.tenant}/products`}
                  className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Ver Productos
                </a>
                {tenantData.mode === "booking" && (
                  <a
                    href={`/t/${params.tenant}/services`}
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
  );
}
