// Define the type for report data
export interface OrderReportItem {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: string;
  currency: string;
  status: string;
  paymentMethod: any;
  terminalId: string;
  createdAt: Date;
  itemCount: number;
  products: string[];
}

// Define type for product report items
export interface ProductReportItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  price: string;
  totalSold: number;
  totalRevenue: number;
  orderCount: number;
}
