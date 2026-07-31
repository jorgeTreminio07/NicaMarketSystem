import { IOrderRepository } from '../repositories/IOrderRepository';
import { Order, OrderItem, PaymentType } from '../../types';

export class GetOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(): Promise<Order[]> {
    return this.orderRepo.getOrders();
  }
}

export class CreateOrderUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(customerName: string, customerPhone: string, items: OrderItem[], paymentType: PaymentType = 'contado'): Promise<Order> {
    return this.orderRepo.createOrder({ customerName, customerPhone, items, paymentType });
  }
}

export class ProcessOrderStatusUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(id: string, status?: 'Aprobado' | 'Rechazado' | 'Pendiente', paymentType?: PaymentType): Promise<{ order: Order; message: string }> {
    return this.orderRepo.updateOrderStatus(id, status, paymentType);
  }
}

export class AddAbonoUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(id: string, amount: number, note?: string): Promise<{ order: Order; message: string }> {
    return this.orderRepo.addAbono(id, amount, note);
  }
}

export class DeleteOrderUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(id: string): Promise<boolean> {
    return this.orderRepo.deleteOrder(id);
  }
}
