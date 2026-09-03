export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPercent?: number;
  category: string;
  stock: number;
  images: string[];
  createdAt: string;
  isDeleted?: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
}

export type PaymentType = 'contado' | 'cuotas_2' | 'cuotas_4';

export interface PaymentScheduleItem {
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  expectedAmount: number;
  paidAmount: number;
  status: 'Pendiente' | 'Parcial' | 'Pagado';
}

export interface AbonoRecord {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  amount: number;
  note?: string;
}

export type CreditStatus = 'En Proceso' | 'Pagado' | 'En Mora';

export interface Order {
  id: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  paymentType?: PaymentType;
  installmentCount?: number;
  paymentSchedule?: PaymentScheduleItem[];
  paymentsHistory?: AbonoRecord[];
  totalPaid?: number;
  creditStatus?: CreditStatus;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type CategoryFilter = string;

export interface StoreSettings {
  id?: string;
  name: string;
  description: string;
  logoUrl: string;
  whatsappNumber: string;
  faviconUrl?: string;
  updatedAt?: string;
}

export interface BackofficeUser {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  createdAt: string;
}
