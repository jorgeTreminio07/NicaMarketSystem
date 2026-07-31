import { Order, OrderItem, PaymentType } from '../../types';

export interface IOrderRepository {
  getOrders(): Promise<Order[]>;
  createOrder(orderData: { customerName: string; customerPhone: string; items: OrderItem[]; paymentType?: PaymentType }): Promise<Order>;
  updateOrderStatus(id: string, status?: 'Aprobado' | 'Rechazado' | 'Pendiente', paymentType?: PaymentType): Promise<{ order: Order; message: string }>;
  addAbono(id: string, amount: number, note?: string): Promise<{ order: Order; message: string }>;
  updateAbono(orderId: string, abonoId: string, amount: number, note?: string): Promise<{ order: Order; message: string }>;
  deleteAbono(orderId: string, abonoId: string): Promise<{ order: Order; message: string }>;
  deleteOrder(id: string): Promise<boolean>;
}
