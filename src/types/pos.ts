export type ProductType = 'unit' | 'weight';
export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type DiscountType = 'percentage' | 'amount';

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  price: number;
  type: ProductType;
  category?: string;
  stock?: number;
  vat: number; // TVA en pourcentage
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount?: {
    type: DiscountType;
    value: number;
  };
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  date: Date;
  items: CartItem[];
  subtotal: number;
  totalVat: number;
  totalDiscount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid?: number;
  change?: number;
  customerId?: string;
  isInvoice?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  specialPrices?: Record<string, number>; // productId -> special price
}

export interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  vat: string;
  phone?: string;
  email?: string;
}
