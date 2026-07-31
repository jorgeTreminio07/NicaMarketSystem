import { IProductRepository } from '../repositories/IProductRepository';
import { Product } from '../../types';

export class GetProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(): Promise<Product[]> {
    const products = await this.productRepo.getProducts();
    // Ensure alphabetical sorting
    return products.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }
}

export class AddProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    return this.productRepo.addProduct(productData);
  }
}

export class UpdateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, productData: Partial<Product>): Promise<Product> {
    return this.productRepo.updateProduct(id, productData);
  }
}

export class UpdateStockUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(id: string, newStock: number): Promise<Product> {
    return this.productRepo.updateStock(id, newStock);
  }
}
