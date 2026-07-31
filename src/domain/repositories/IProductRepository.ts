import { Product } from '../../types';

export interface IProductRepository {
  getProducts(): Promise<Product[]>;
  addProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product>;
  updateStock(id: string, newStock: number): Promise<Product>;
  deleteProduct(id: string): Promise<boolean>;
}
