import { notFound } from 'next/navigation';
import { getTenantDataForPage } from '@/lib/db/tenant-service';


interface ProductsPageProps {
  params: {
    tenant: string;
  };
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const tenantData = await getTenantDataForPage(params.tenant);

  const branding = tenantData.branding as any;
  const categories = Array.from(new Set(tenantData.products.map((p: any) => p.metadata?.category || 'general')));

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white"
         style={{background: `linear-gradient(to bottom, ${branding.primaryColor}10, white)`}}>

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
              <h1 className="text-2xl font-bold" style={{color: branding.primaryColor}}>
                Productos
              </h1>
            </div>
            <nav className="flex space-x-4">
              <a href={`/t/${params.tenant}/services`} className="text-gray-600 hover:text-gray-900">Servicios</a>
              <a href={`/t/${params.tenant}/cart`} className="text-gray-600 hover:text-gray-900">Carrito</a>
              <a href={`/t/${params.tenant}/login`} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Login</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                Todos
              </button>
              {categories.map((category) => (
                <button key={String(category)}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 capitalize">
                  {String(category).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tenantData.products.map((product: any) => {
            const metadata = product.metadata as any;
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="text-5xl mb-4 text-center">{metadata?.image || '📦'}</div>
                  <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold"
                          style={{color: branding.primaryColor}}>
                      ${product.price}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                      {metadata?.category?.replace('-', ' ') || 'general'}
                    </span>
                  </div>

                  {/* Click Budget: ≤3 clicks to purchase */}
                  <div className="space-y-2">
                    <button className="w-full py-2 px-4 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
                      Añadir al carrito (1/3)
                    </button>
                    <button className="w-full py-3 px-6 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                            style={{backgroundColor: branding.primaryColor}}>
                      Comprar ahora (1/3)
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Purchase Flow */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Compra Rápida (≤3 clicks)</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold"
                   style={{backgroundColor: branding.primaryColor}}>
                1
              </div>
              <h3 className="font-semibold mb-2">Seleccionar</h3>
              <p className="text-gray-600 text-sm">Elige tu producto favorito</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold"
                   style={{backgroundColor: branding.primaryColor}}>
                2
              </div>
              <h3 className="font-semibold mb-2">Confirmar</h3>
              <p className="text-gray-600 text-sm">Revisar detalles del pedido</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold"
                   style={{backgroundColor: branding.primaryColor}}>
                3
              </div>
              <h3 className="font-semibold mb-2">Pagar</h3>
              <p className="text-gray-600 text-sm">Finalizar compra</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}