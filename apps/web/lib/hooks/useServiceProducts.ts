"use client";

import { useState, useCallback, useEffect } from "react";
import { useInventory } from "./useInventory";

export interface ServiceProduct {
  id: string;
  tenantId: string;
  serviceId: string;
  serviceName: string;
  productId: string;
  productName: string;
  quantity: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  unitPrice: number;
}

export function useServiceProducts(serviceId?: string) {
  const {
    getServiceProducts,
    addProductsToService,
    removeProductFromService,
    getInventory,
    loading: apiLoading,
    error: apiError,
  } = useInventory();

  const [serviceProducts, setServiceProducts] = useState<ServiceProduct[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar productos asociados al servicio
  const loadServiceProducts = useCallback(async () => {
    if (!serviceId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getServiceProducts(serviceId);
      setServiceProducts(response.relations);
    } catch (err: any) {
      setError(err.message || "Error al cargar productos del servicio");
    } finally {
      setLoading(false);
    }
  }, [getServiceProducts, serviceId]);

  // Cargar productos disponibles para asociar
  const loadAvailableProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getInventory({ limit: 100 }); // Obtener hasta 100 productos
      const products = response.data.map((item) => ({
        id: item.productId,
        name: item.productName,
        sku: item.productSku,
        currentStock: item.availableQuantity,
        unitPrice: item.unitPrice,
      }));

      // Filtrar productos que ya están asociados al servicio
      const associatedProductIds = serviceProducts.map((sp) => sp.productId);
      const filteredProducts = products.filter(
        (product) => !associatedProductIds.includes(product.id),
      );

      setAvailableProducts(filteredProducts);
    } catch (err: any) {
      setError(err.message || "Error al cargar productos disponibles");
    } finally {
      setLoading(false);
    }
  }, [getInventory, serviceProducts]);

  // Agregar productos al servicio
  const addProducts = useCallback(
    async (products: { productId: string; quantity: number }[]) => {
      if (!serviceId) throw new Error("Service ID is required");

      setLoading(true);
      setError(null);

      try {
        const response = await addProductsToService(serviceId, products);
        setServiceProducts(response.relations);

        // Actualizar productos disponibles
        await loadAvailableProducts();

        return response.relations;
      } catch (err: any) {
        setError(err.message || "Error al agregar productos al servicio");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addProductsToService, serviceId, loadAvailableProducts],
  );

  // Eliminar producto del servicio
  const removeProduct = useCallback(
    async (productId: string) => {
      if (!serviceId) throw new Error("Service ID is required");

      setLoading(true);
      setError(null);

      try {
        const response = await removeProductFromService(serviceId, productId);
        setServiceProducts((prev) =>
          prev.filter((sp) => sp.productId !== productId),
        );

        // Actualizar productos disponibles
        await loadAvailableProducts();

        return response.relation;
      } catch (err: any) {
        setError(err.message || "Error al eliminar producto del servicio");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [removeProductFromService, serviceId, loadAvailableProducts],
  );

  // Actualizar cantidad de un producto en el servicio
  const updateProductQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!serviceId) throw new Error("Service ID is required");

      setLoading(true);
      setError(null);

      try {
        // Primero eliminar el producto actual
        await removeProductFromService(serviceId, productId);

        // Luego agregarlo con la nueva cantidad
        const response = await addProductsToService(serviceId, [
          { productId, quantity },
        ]);
        setServiceProducts(response.relations);

        return response.relations;
      } catch (err: any) {
        setError(err.message || "Error al actualizar cantidad del producto");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [removeProductFromService, addProductsToService, serviceId],
  );

  // Calcular el costo total de los productos del servicio
  const calculateTotalCost = useCallback(() => {
    return serviceProducts.reduce((total, product) => {
      const productInfo = availableProducts.find(
        (p) => p.id === product.productId,
      );
      const unitPrice = productInfo?.unitPrice || 0;
      return total + unitPrice * product.quantity;
    }, 0);
  }, [serviceProducts, availableProducts]);

  // Verificar si hay suficiente stock para todos los productos
  const checkStockAvailability = useCallback(() => {
    return serviceProducts.map((product) => {
      const productInfo = availableProducts.find(
        (p) => p.id === product.productId,
      );
      const availableStock = productInfo?.currentStock || 0;
      const hasStock = availableStock >= product.quantity;

      return {
        productId: product.productId,
        productName: product.productName,
        required: product.quantity,
        available: availableStock,
        hasStock,
        deficit: hasStock ? 0 : product.quantity - availableStock,
      };
    });
  }, [serviceProducts, availableProducts]);

  // Cargar productos del servicio cuando cambia el serviceId
  useEffect(() => {
    if (serviceId) {
      loadServiceProducts();
    }
  }, [loadServiceProducts, serviceId]);

  // Cargar productos disponibles cuando cambian los productos del servicio
  useEffect(() => {
    if (serviceId && serviceProducts.length > 0) {
      loadAvailableProducts();
    }
  }, [serviceId, serviceProducts, loadAvailableProducts]);

  return {
    serviceProducts,
    availableProducts,
    loading: loading || apiLoading,
    error: error || apiError,
    loadServiceProducts,
    loadAvailableProducts,
    addProducts,
    removeProduct,
    updateProductQuantity,
    calculateTotalCost,
    checkStockAvailability,
  };
}
