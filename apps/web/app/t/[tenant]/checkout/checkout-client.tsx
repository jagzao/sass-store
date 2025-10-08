"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckoutForm } from "@/components/payments/checkout-form";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "service" | "product";
  image?: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface CheckoutClientProps {
  tenantData: {
    id: string;
    slug: string;
    name: string;
    branding: {
      primaryColor: string;
    };
  };
  selectedServiceId?: string;
}

export function CheckoutClient({
  tenantData,
  selectedServiceId,
}: CheckoutClientProps) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Mock cart data - in a real app this would come from localStorage, context, or API
    const mockCart: CartItem[] = [
      {
        id: "1",
        name: "Gel Manicure",
        price: 45.0,
        quantity: 1,
        type: "service",
        image: "💅",
      },
      {
        id: "2",
        name: "Esmalte Premium",
        price: 15.0,
        quantity: 2,
        type: "product",
        image: "💅",
      },
    ];

    setCartItems(mockCart);
    setIsLoading(false);
  }, []);

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const createOrder = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      alert("Por favor completa la información requerida");
      return;
    }

    setIsCreatingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantData.id,
        },
        body: JSON.stringify({
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          items: cartItems.map((item) => ({
            type: item.type,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          total,
          type: "purchase",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const { orderId: newOrderId } = await response.json();
      setOrderId(newOrderId);
      setShowPayment(true);
    } catch (error) {
      console.error("Order creation error:", error);
      alert("Error al crear la orden. Por favor intenta nuevamente.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    // Redirect to success page
    router.push(
      `/t/${tenantData.slug}/checkout/success?payment_intent=${paymentIntent.id}`,
    );
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
    alert(`Error en el pago: ${error}`);
    setShowPayment(false);
    setOrderId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tu carrito está vacío
          </h1>
          <p className="text-gray-600 mb-6">
            Agrega algunos productos o servicios para continuar
          </p>
          <button
            onClick={() => router.push(`/t/${tenantData.slug}`)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Ir a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">
            Completa tu compra de forma segura
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Order Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Tu Pedido</h2>

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-4 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{item.image || "📦"}</div>
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.quantity} |{" "}
                        {item.type === "service" ? "Servicio" : "Producto"}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>Gratis</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Customer Info & Payment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {!showPayment ? (
              <>
                <h2 className="text-xl font-semibold mb-6">
                  Información del Cliente
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) =>
                        handleCustomerInfoChange("name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        handleCustomerInfoChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        handleCustomerInfoChange("phone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+52 555 123 4567"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={createOrder}
                      disabled={
                        isCreatingOrder ||
                        !customerInfo.name ||
                        !customerInfo.email
                      }
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {isCreatingOrder ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creando orden...
                        </>
                      ) : (
                        "Continuar al pago"
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : orderId ? (
              <>
                <h2 className="text-xl font-semibold mb-6">Pago</h2>
                <CheckoutForm
                  orderId={orderId}
                  amount={total}
                  currency="mxn"
                  tenantId={tenantData.id}
                  customerInfo={customerInfo}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
