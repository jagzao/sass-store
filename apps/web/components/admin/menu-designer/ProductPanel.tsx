"use client";

import { useState, useEffect } from "react";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category?: string;
}

export interface Service {
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
  onSelectionChange?: (
    selectedProducts: Product[],
    selectedServices: Service[],
  ) => void;
}

export default function ProductPanel({
  tenantSlug,
  onSelectionChange,
}: ProductPanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "services">(
    "services", // Default to services based on user request
  );

  // Selection state
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(),
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
          const loadedProducts = productsData.data || [];
          setProducts(loadedProducts);
        }

        // Fetch services
        const servicesRes = await fetch(
          `/api/v1/public/services?tenant=${tenantSlug}`,
        );
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          const loadedServices = servicesData.data || [];
          setServices(loadedServices);

          // Auto-select all services by default
          const allServiceIds = new Set(
            loadedServices.map((s: Service) => s.id),
          );
          setSelectedServiceIds(allServiceIds as Set<string>);
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

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedProds = products.filter((p) =>
        selectedProductIds.has(p.id),
      );
      const selectedServs = services.filter((s) =>
        selectedServiceIds.has(s.id),
      );
      onSelectionChange(selectedProds, selectedServs);
    }
  }, [
    selectedProductIds,
    selectedServiceIds,
    products,
    services,
    onSelectionChange,
  ]);

  const toggleProduct = (id: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProductIds(newSelected);
  };

  const toggleService = (id: string) => {
    const newSelected = new Set(selectedServiceIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedServiceIds(newSelected);
  };

  const toggleAllServices = () => {
    if (selectedServiceIds.size === services.length) {
      setSelectedServiceIds(new Set());
    } else {
      setSelectedServiceIds(new Set(services.map((s) => s.id)));
    }
  };

  const toggleAllProducts = () => {
    if (selectedProductIds.size === products.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(products.map((p) => p.id)));
    }
  };

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
    <div className="h-full flex flex-col bg-white border-r border-gray-200 w-80">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg mb-4">Elementos</h3>
        <div className="flex rounded-md bg-gray-100 p-1 mb-4">
          <button
            className={`flex-1 py-1 px-3 rounded text-sm font-medium transition-all ${
              activeTab === "services"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("services")}
          >
            Servicios
          </button>
          <button
            className={`flex-1 py-1 px-3 rounded text-sm font-medium transition-all ${
              activeTab === "products"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("products")}
          >
            Productos
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "products" ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {filteredProducts.length} Productos
              </span>
              <button
                onClick={toggleAllProducts}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {selectedProductIds.size === products.length
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </button>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-4 text-sm">
                No se encontraron productos
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, product, "product")}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProductIds.has(product.id)
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.has(product.id)}
                    onChange={() => {}} // Handled by parent div onClick
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {product.description}
                    </p>
                    <div className="mt-1 font-semibold text-sm text-gray-900">
                      ${Number(product.price || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {filteredServices.length} Servicios
              </span>
              <button
                onClick={toggleAllServices}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {selectedServiceIds.size === services.length
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </button>
            </div>
            {filteredServices.length === 0 ? (
              <div className="text-center text-gray-500 py-4 text-sm">
                No se encontraron servicios
              </div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={service.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, service, "service")}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedServiceIds.has(service.id)
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => toggleService(service.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.has(service.id)}
                    onChange={() => {}} // Handled by parent div onClick
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {service.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {service.description}
                    </p>
                    <div className="mt-1 flex justify-between items-center">
                      <span className="font-bold text-sm text-gray-900">
                        ${Number(service.price || 0).toFixed(2)}
                      </span>
                      {service.duration && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {service.duration}h
                        </span>
                      )}
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
