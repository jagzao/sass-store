"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TopNav } from "@/components/navigation/top-nav";
import { useTenantSlug } from "@/lib/tenant/client-resolver";

interface PaymentDetails {
  id: string;
  status: string;
  amount: number;
  currency: string;
  orderId: string;
  orderNumber?: string;
  customerName?: string;
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = useTenantSlug();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentIntentId = searchParams?.get("payment_intent");

  useEffect(() => {
    if (!paymentIntentId) {
      setError("No payment information found");
      setIsLoading(false);
      return;
    }

    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(
          `/api/payments/create-intent?paymentIntentId=${paymentIntentId}`,
        );

        if (!response.ok) {
          throw new Error("Failed to retrieve payment details");
        }

        const data = await response.json();

        if (data.paymentIntent.status !== "succeeded") {
          throw new Error("Payment was not successful");
        }

        setPaymentDetails({
          id: data.paymentIntent.id,
          status: data.paymentIntent.status,
          amount: data.paymentIntent.amount,
          currency: data.paymentIntent.currency,
          orderId: data.paymentIntent.metadata.orderId,
          orderNumber: data.paymentIntent.metadata.orderNumber,
          customerName: data.paymentIntent.metadata.customerName,
        });
      } catch (err) {
        console.error("Error fetching payment details:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentIntentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav tenantInfo={{ id: "", name: "", categories: [] }} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando el pago...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav tenantInfo={{ id: "", name: "", categories: [] }} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Error en el pago
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => router.push(`/t/${tenantSlug}/checkout`)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Intentar nuevamente
              </button>
              <Link
                href={`/t/${tenantSlug}`}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 inline-block"
              >
                Ir a la tienda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav tenantInfo={{ id: "", name: "", categories: [] }} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Pago exitoso!
            </h1>
            <p className="text-gray-600">
              Tu orden ha sido procesada correctamente
            </p>
          </div>

          {/* Payment Details Card */}
          {paymentDetails && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Detalles del pago</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de pago:</span>
                  <span className="font-mono text-sm">{paymentDetails.id}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-semibold text-green-600">
                    ${paymentDetails.amount.toFixed(2)}{" "}
                    {paymentDetails.currency.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    ✓ Completado
                  </span>
                </div>

                {paymentDetails.orderNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Número de orden:</span>
                    <span className="font-mono text-sm">
                      {paymentDetails.orderNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">¿Qué sigue?</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">📧</span>
                <span>
                  Te enviaremos un email de confirmación con todos los detalles
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📱</span>
                <span>
                  Recibirás notificaciones sobre el estado de tu orden
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📞</span>
                <span>
                  Si tienes preguntas, puedes contactarnos en cualquier momento
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/t/${tenantSlug}/orders`}
              className="flex-1 bg-blue-600 text-white text-center py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ver mis pedidos
            </Link>

            <Link
              href={`/t/${tenantSlug}`}
              className="flex-1 bg-gray-600 text-white text-center py-3 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Seguir comprando
            </Link>
          </div>

          {/* Customer Support */}
          <div className="text-center mt-8 p-4 border-t">
            <p className="text-gray-600 text-sm mb-2">¿Necesitas ayuda?</p>
            <div className="flex justify-center space-x-4 text-sm">
              <Link
                href={`/t/${tenantSlug}/support`}
                className="text-blue-600 hover:text-blue-800"
              >
                Contactar soporte
              </Link>
              <span className="text-gray-600">|</span>
              <Link
                href={`/t/${tenantSlug}/faq`}
                className="text-blue-600 hover:text-blue-800"
              >
                Preguntas frecuentes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
