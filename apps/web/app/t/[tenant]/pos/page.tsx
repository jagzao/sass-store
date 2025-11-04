"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import UserMenu from "@/components/auth/UserMenu";
import { useFinance } from "@/lib/hooks/use-finance";

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export default function POSPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "mercadopago"
  >("cash");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/t/${tenantSlug}/login`);
    }
  }, [status, router, tenantSlug]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tenant info
        const tenantResponse = await fetch(`/api/tenants/${tenantSlug}`);
        if (tenantResponse.ok) {
          const tenantData = await tenantResponse.json();
          setCurrentTenant(tenantData);
        }

        // Load products
        const productsResponse = await fetch("/api/v1/products");
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.data || []);
        }
      } catch (error) {
        console.error("Error loading POS data:", error);
      }
    };

    if (session?.user) {
      loadData();
    }
  }, [session, tenantSlug]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    "all",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            unitPrice: product.price,
            totalPrice: product.price,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              totalPrice: quantity * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId)
    );
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  const processSale = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      // Get or generate a terminal ID for this browser/device
      let terminalId = localStorage.getItem('posTerminalId');
      if (!terminalId) {
        // Generate a unique terminal ID for this device
        terminalId = `pos-web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('posTerminalId', terminalId);
      }

      const saleData = {
        terminalId,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        customerName: customerName.trim() || undefined,
        paymentMethod,
      };

      const response = await fetch("/api/finance/pos/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process sale");
      }

      const result = await response.json();

      // Clear cart and reset form
      setCart([]);
      setCustomerName("");
      setPaymentMethod("cash");

      alert(
        `Venta procesada exitosamente!\nTotal: $${getTotal().toFixed(2)}\nOrden: ${result.data.order.orderNumber}`
      );
    } catch (error) {
      console.error("Error processing sale:", error);
      alert("Error al procesar la venta: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛒</div>
          <p className="text-gray-600">Cargando punto de venta...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a
                href={`/t/${tenantSlug}`}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Volver a {currentTenant?.name || "Inicio"}
              </a>
              <h1 className="text-2xl font-bold text-gray-900">
                🛒 Punto de Venta - {currentTenant?.name || "Negocio"}
              </h1>
            </div>
            <UserMenu tenantSlug={tenantSlug} />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Productos
              </h2>

              {/* Search and Filter */}
              <div className="mb-6 space-y-4">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category === "all" ? "Todos" : category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📦</div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        SKU: {product.sku}
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        ${product.price.toFixed(2)}
                      </p>
                      <button className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                        Agregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron productos
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Carrito ({cart.length} items)
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">🛒</div>
                  Carrito vacío
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          ${item.unitPrice.toFixed(2)} c/u
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-gray-900">
                          ${item.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">
                        ${getTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer & Payment */}
            {cart.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900">
                  Información de Venta
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Cliente (opcional)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Cliente"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: "cash", label: "💵 Efectivo", icon: "💵" },
                        { value: "card", label: "💳 Tarjeta", icon: "💳" },
                        {
                          value: "mercadopago",
                          label: "📱 Mercado Pago",
                          icon: "📱",
                        },
                      ].map((method) => (
                        <label key={method.value} className="flex items-center">
                          <input
                            type="radio"
                            value={method.value}
                            checked={paymentMethod === method.value}
                            onChange={(e) =>
                              setPaymentMethod(e.target.value as any)
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm">{method.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={processSale}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                  >
                    {loading
                      ? "Procesando..."
                      : `💰 Cobrar $${getTotal().toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
