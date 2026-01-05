"use client";

import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  duration?: number;
}

interface ProductPanelProps {
  tenantSlug: string;
  onProductSelect?: (product: Product) => void;
  onServiceSelect?: (service: Service) => void;
}

export default function ProductPanel({
  tenantSlug,
  onProductSelect,
  onServiceSelect,
}: ProductPanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "services">(
    "products",
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch products
        const productsRes = await fetch(
          `/api/v1/public/products?tenant=${tenantSlug}`,
        );
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.data || []);
        }

        // Fetch services
        const servicesRes = await fetch(
          `/api/v1/public/services?tenant=${tenantSlug}`,
        );
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServices(servicesData.data || []);
        }
      } catch (error) {
        console.error("Error fetching products and services:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tenantSlug) {
      fetchData();
    }
  }, [tenantSlug]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDragStart = (
    e: React.DragEvent,
    item: Product | Service,
    type: "product" | "service",
  ) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type,
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
      }),
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Cargando productos y servicios...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-2 px-4 text-center text-sm font-medium ${
              activeTab === "products"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("products")}
          >
            Productos
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center text-sm font-medium ${
              activeTab === "services"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("services")}
          >
            Servicios
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "products" ? (
          <div className="space-y-2">
            {filteredProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No se encontraron productos
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, product, "product")}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm text-gray-900">
                        ${product.price.toFixed(2)}
                      </div>
                      {product.category && (
                        <div className="text-xs text-gray-500 mt-1">
                          {product.category}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredServices.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No se encontraron servicios
              </div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={service.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, service, "service")}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {service.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {service.description}
                      </p>
                      {service.duration && (
                        <div className="text-xs text-gray-500 mt-1">
                          {service.duration} min
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm text-gray-900">
                        ${service.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
