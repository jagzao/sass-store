import { notFound } from 'next/navigation';
import Link from 'next/link';

// Mock data - in real app this would come from database
const TENANTS_DATA = {
  wondernails: {
    id: "wondernails",
    name: "Wonder Nails Studio",
    branding: {
      primaryColor: "#DC2626",
      secondaryColor: "#1F2937",
    }
  },
  vigistudio: {
    id: "vigistudio",
    name: "Vigi Studio",
    branding: {
      primaryColor: "#DC2626",
      secondaryColor: "#1F2937",
    }
  },
  "centro-tenistico": {
    id: "centro-tenistico",
    name: "Centro Tenístico Villafuerte",
    branding: {
      primaryColor: "#DC2626",
      secondaryColor: "#1F2937",
    }
  },
  "vainilla-vargas": {
    id: "vainilla-vargas",
    name: "Vainilla Vargas",
    branding: {
      primaryColor: "#DC2626",
      secondaryColor: "#1F2937",
    }
  },
  delirios: {
    id: "delirios",
    name: "Delirios",
    branding: {
      primaryColor: "#DC2626",
      secondaryColor: "#1F2937",
    }
  },
  "nom-nom": {
    id: "nom-nom",
    name: "nom-nom",
    branding: {
      primaryColor: "#DC2626",
      secondaryColor: "#1F2937",
    }
  },
  "zo-system": {
    id: "zo-system",
    name: "Zo System",
    branding: {
      primaryColor: "#DC2626",
      secondaryColor: "#1F2937",
    }
  }
};

// Mock previous orders
const PREVIOUS_ORDERS = [
  {
    id: "order-001",
    date: "2024-01-15",
    items: [
      { name: "Classic Manicure", price: 35.00, type: "service" },
      { name: "Sunset Orange Polish", price: 22.00, type: "product" }
    ],
    total: 57.00
  },
  {
    id: "order-002",
    date: "2024-01-08",
    items: [
      { name: "Gel Manicure", price: 55.00, type: "service" }
    ],
    total: 55.00
  },
  {
    id: "order-003",
    date: "2023-12-20",
    items: [
      { name: "Custom Nail Art", price: 75.00, type: "service" },
      { name: "Nourishing Cuticle Oil", price: 16.00, type: "product" }
    ],
    total: 91.00
  }
];

interface ReorderPageProps {
  params: {
    tenant: string;
  };
}

export default function ReorderPage({ params }: ReorderPageProps) {
  const tenantData = TENANTS_DATA[params.tenant as keyof typeof TENANTS_DATA];

  if (!tenantData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white"
         style={{background: `linear-gradient(to bottom, ${tenantData.branding.primaryColor}10, white)`}}>

      {/* Header */}
      <div className="relative bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/t/${params.tenant}`}
                    className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block">
                ← Volver a {tenantData.name}
              </Link>
              <h1 className="text-3xl font-bold"
                  style={{color: tenantData.branding.primaryColor}}>
                Reordenar (1 click)
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Quick Reorder Description */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Reorden Instantáneo</h2>
          <p className="text-gray-600 mb-4">
            Repite fácilmente tus pedidos anteriores con un solo click.
            Perfecto para tus servicios y productos favoritos.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <span className="text-green-800 font-semibold">1 click reorder guarantee</span>
            </div>
          </div>
        </div>

        {/* Previous Orders */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Tus Pedidos Anteriores</h2>

          {PREVIOUS_ORDERS.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Pedido #{order.id}</h3>
                  <p className="text-gray-600 text-sm">
                    {new Date(order.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <span className="text-xl font-bold"
                      style={{color: tenantData.branding.primaryColor}}>
                  ${order.total}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-3">
                        {item.type === 'service' ? '📅' : '🛍️'}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    <span className="font-semibold">${item.price}</span>
                  </div>
                ))}
              </div>

              {/* 1-Click Reorder Button */}
              <button className="w-full py-3 px-6 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                      style={{backgroundColor: tenantData.branding.primaryColor}}>
                🔄 Reordenar idéntico (1 click)
              </button>
            </div>
          ))}
        </div>

        {/* Favorites Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">Tus Favoritos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="text-center mb-3">
                <span className="text-3xl">💅</span>
              </div>
              <h3 className="font-semibold mb-1">Classic Manicure</h3>
              <p className="text-gray-600 text-sm mb-3">Tu servicio más pedido</p>
              <button className="w-full py-2 px-4 rounded text-white font-semibold hover:opacity-90 transition-opacity"
                      style={{backgroundColor: tenantData.branding.primaryColor}}>
                Reordenar
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="text-center mb-3">
                <span className="text-3xl">🧡</span>
              </div>
              <h3 className="font-semibold mb-1">Sunset Orange Polish</h3>
              <p className="text-gray-600 text-sm mb-3">Tu producto favorito</p>
              <button className="w-full py-2 px-4 rounded text-white font-semibold hover:opacity-90 transition-opacity"
                      style={{backgroundColor: tenantData.branding.primaryColor}}>
                Reordenar
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
              <div className="text-center mb-3">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="font-semibold mb-1">Combo Especial</h3>
              <p className="text-gray-600 text-sm mb-3">Manicure + Polish</p>
              <button className="w-full py-2 px-4 rounded text-white font-semibold hover:opacity-90 transition-opacity"
                      style={{backgroundColor: tenantData.branding.primaryColor}}>
                Reordenar
              </button>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">¿No encuentras lo que buscas?</p>
          <div className="space-x-4">
            <Link href={`/t/${params.tenant}/services`}
                  className="inline-block px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
              Ver todos los servicios
            </Link>
            <Link href={`/t/${params.tenant}/products`}
                  className="inline-block px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
              Ver todos los productos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}