/**
 * Report types for analytics and reporting
 */

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  [key: string]: string | undefined;
}

export interface SaleData {
  id?: string;
  orderId?: string;
  orderNumber?: string;
  date?: string;
  customerName?: string;
  terminalId?: string;
  totalAmount?: number;
  total?: string;
  paymentMethod?: {
    paymentMethod?: string;
  };
  status?: string;
  itemsCount?: number;
  createdAt?: string;
}

export interface ProductSalesData {
  id?: string;
  productId?: string;
  name: string;
  sku: string;
  category: string;
  price?: string;
  unitsSold?: number;
  totalSold?: number;
  revenue?: number;
  averagePrice?: number;
}

export interface SalesReport {
  data: SaleData[];
  summary: {
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalItems: number;
    paymentMethodBreakdown: Record<string, number>;
  };
  filters: ReportFilters;
  generatedAt: string;
}

export interface ProductsReport {
  data: ProductSalesData[];
  summary: {
    totalProducts: number;
    totalRevenue: number;
    totalUnitsSold: number;
    averagePrice: number;
    topCategory: Record<string, number>;
  };
  filters: ReportFilters;
  generatedAt: string;
}
