import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../../types';
import { Edit, Trash2, Plus, Minus, Search, AlertCircle, Package, Loader2 } from 'lucide-react';
import { EditProductModal } from './EditProductModal';

interface StockManagementSectionProps {
  products: Product[];
  onUpdateStock: (id: string, newStock: number) => Promise<void>;
  onUpdateProduct: (id: string, updatedData: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const StockManagementSection: React.FC<StockManagementSectionProps> = ({
  products,
  onUpdateStock,
  onUpdateProduct,
  onDeleteProduct,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Automatic Infinite Scroll state (Charge 10 by 10)
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery]);

  const filteredProducts = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  // Automatic Infinite Scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredProducts.length) {
          setVisibleCount(prev => prev + 10);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length]);

  const handleStockChange = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, product.stock + delta);
    await onUpdateStock(product.id, nextStock);
  };

  const handleDeleteConfirm = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto de la tienda?')) {
      setDeletingId(id);
      try {
        await onDeleteProduct(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Control de Stock e Inventario</h2>
          <p className="text-xs text-slate-500">
            Visualiza el número de unidades disponibles, ajusta las cantidades rápidamente o edita la información completa del producto.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar en inventario..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Inventory Table / Cards */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <Package className="w-8 h-8 text-emerald-600 animate-pulse mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Cargando inventario...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No se encontraron productos</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery ? 'Prueba con otro término de búsqueda.' : 'Agrega tu primer producto desde la pestaña "Agregar Producto".'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Precio</th>
                    <th className="py-3 px-4 text-center">Unidades en Stock</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {visibleProducts.map(product => {
                    const isOutOfStock = product.stock <= 0;
                    const isLowStock = product.stock > 0 && product.stock <= 5;
                    const image = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Product Column */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={image}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                              }}
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate max-w-xs">
                                {product.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                ID: {product.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {product.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4">
                          {product.discountPercent && product.discountPercent > 0 ? (
                            <div>
                              <span className="text-[10px] line-through text-slate-400 font-bold block">
                                C$ {product.price.toFixed(2)}
                              </span>
                              <span className="font-extrabold text-rose-600 block">
                                C$ {(product.price * (1 - product.discountPercent / 100)).toFixed(2)}
                              </span>
                              <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-extrabold inline-block mt-0.5">
                                -{product.discountPercent}%
                              </span>
                            </div>
                          ) : (
                            <span className="font-extrabold text-slate-900">
                              C$ {product.price.toFixed(2)}
                            </span>
                          )}
                        </td>

                        {/* Stock Adjuster */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleStockChange(product, -1)}
                              disabled={product.stock <= 0}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all disabled:opacity-30"
                              title="Restar 1 al stock"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-black min-w-12 text-center border ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {product.stock}
                            </span>

                            <button
                              onClick={() => handleStockChange(product, 1)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all"
                              title="Sumar 1 al stock"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Editar producto completo"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              disabled={deletingId === product.id}
                              onClick={() => handleDeleteConfirm(product.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-40"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sentinel element for infinite scroll */}
          {visibleCount < filteredProducts.length && (
            <div ref={loadMoreRef} className="py-4 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Cargando más productos automáticamente...</span>
            </div>
          )}
        </div>
      )}

      {/* Full Edit Product Modal */}
      <EditProductModal
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={onUpdateProduct}
      />
    </div>
  );
};
