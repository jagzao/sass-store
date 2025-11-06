'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useTenantSlug } from '@/lib/tenant/client-resolver';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface StripePaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created: number;
  client_secret: string;
}

interface CheckoutFormProps {
  orderId: string;
  amount: number;
  currency: string;
  tenantId: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  onSuccess: (paymentIntent: StripePaymentIntent) => void;
  onError: (error: string) => void;
}

interface PaymentFormProps extends CheckoutFormProps {
  clientSecret: string;
}

function PaymentForm({
  orderId,
  amount,
  currency,
  customerInfo,
  clientSecret,
  onSuccess,
  onError
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not loaded yet');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone
          }
        }
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent as StripePaymentIntent);
      } else {
        onError('Payment was not successful');
      }
    } catch (err) {
      onError('An unexpected error occurred');
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, sans-serif'
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Información de la tarjeta
        </label>
        <div className="p-4 border border-gray-300 rounded-lg bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span>${amount.toFixed(2)} {currency.toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center text-sm mt-1">
          <span className="text-gray-600">Procesamiento:</span>
          <span>Incluido</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between items-center font-semibold">
          <span>Total:</span>
          <span>${amount.toFixed(2)} {currency.toUpperCase()}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Procesando pago...
          </>
        ) : (
          <>
            <span className="mr-2">💳</span>
            Pagar ${amount.toFixed(2)}
          </>
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center">
            <span className="mr-1">🔒</span>
            Pago seguro con SSL
          </div>
          <div className="flex items-center">
            <span className="mr-1">💳</span>
            Visa, Mastercard, AMEX
          </div>
        </div>
        <p className="mt-2">
          Tu información está protegida con encriptación de nivel bancario
        </p>
      </div>
    </form>
  );
}

export function CheckoutForm({
  orderId,
  amount,
  currency,
  tenantId,
  customerInfo,
  onSuccess,
  onError
}: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tenantSlug = useTenantSlug();

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId
          },
          body: JSON.stringify({
            orderId,
            currency
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Payment intent creation error:', err);
        onError(err instanceof Error ? err.message : 'Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [orderId, currency, onError, tenantId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">⚠️</div>
        <p className="text-gray-600">No se pudo inicializar el pago</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px'
      }
    }
  };

  if (!stripePromise) {
    return (
      <div className="text-center py-8">
        <div className="text-yellow-600 mb-4">⚠️</div>
        <p className="text-gray-600 mb-4">Stripe no está configurado correctamente</p>
        <p className="text-sm text-gray-500">
          Para procesar pagos, configura las variables de entorno de Stripe
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      <PaymentForm
        orderId={orderId}
        amount={amount}
        currency={currency}
        tenantId={tenantId}
        customerInfo={customerInfo}
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

export default CheckoutForm;