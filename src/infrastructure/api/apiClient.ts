import { Product, Order, OrderItem, PaymentType } from '../../types';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';

export class ApiProductRepository implements IProductRepository {
  async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Error al obtener los productos');
    return res.json();
  }

  async addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar el producto');
    }
    return res.json();
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar el producto');
    }
    return res.json();
  }

  async updateStock(id: string, newStock: number): Promise<Product> {
    const res = await fetch(`/api/products/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar el stock');
    }
    return res.json();
  }

  async deleteProduct(id: string): Promise<boolean> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar el producto');
    return true;
  }
}

export class ApiOrderRepository implements IOrderRepository {
  async getOrders(): Promise<Order[]> {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Error al cargar las solicitudes');
    return res.json();
  }

  async createOrder(orderData: { customerName: string; customerPhone: string; items: OrderItem[]; paymentType?: PaymentType }): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al procesar la compra');
    }
    return res.json();
  }

  async updateOrderStatus(id: string, status?: 'Aprobado' | 'Rechazado' | 'Pendiente', paymentType?: PaymentType): Promise<{ order: Order; message: string }> {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, paymentType }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar el estado de la solicitud');
    }
    return res.json();
  }

  async addAbono(id: string, amount: number, note?: string): Promise<{ order: Order; message: string }> {
    const res = await fetch(`/api/orders/${id}/abonos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, note }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar el abono');
    }
    return res.json();
  }

  async updateAbono(orderId: string, abonoId: string, amount: number, note?: string): Promise<{ order: Order; message: string }> {
    const res = await fetch(`/api/orders/${orderId}/abonos/${abonoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, note }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar el abono');
    }
    return res.json();
  }

  async deleteAbono(orderId: string, abonoId: string): Promise<{ order: Order; message: string }> {
    const res = await fetch(`/api/orders/${orderId}/abonos/${abonoId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar el abono');
    }
    return res.json();
  }

  async deleteOrder(id: string): Promise<boolean> {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar la solicitud');
    }
    return true;
  }
}

export async function getStoreSettings(): Promise<import('../../types').StoreSettings> {
  const res = await fetch('/api/store-settings');
  if (!res.ok) throw new Error('Error al obtener la configuración de la tienda');
  return res.json();
}

export async function updateStoreSettings(settings: Partial<import('../../types').StoreSettings>): Promise<import('../../types').StoreSettings> {
  const res = await fetch('/api/store-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al actualizar la configuración de la tienda');
  }
  return res.json();
}

export async function loginUser(email: string, password: string): Promise<import('../../types').BackofficeUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al iniciar sesión');
  }
  const data = await res.json();
  return data.user;
}

export async function getUsers(): Promise<import('../../types').BackofficeUser[]> {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Error al obtener los usuarios');
  return res.json();
}

export async function createUser(user: { email: string; password: string; role?: string }): Promise<import('../../types').BackofficeUser> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al crear el usuario');
  }
  return res.json();
}

export async function deleteUser(id: string): Promise<boolean> {
  const res = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al eliminar el usuario');
  }
  return true;
}

export async function seedDatabase(adminCredentials?: { email: string; password: string }): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminCredentials || {}),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al poblar la base de datos');
  }
  return res.json();
}

export async function clearDatabase(adminCredentials?: { email: string; password: string }): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/clear-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminCredentials || {}),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al vaciar la base de datos');
  }
  return res.json();
}

export const productRepository = new ApiProductRepository();
export const orderRepository = new ApiOrderRepository();

