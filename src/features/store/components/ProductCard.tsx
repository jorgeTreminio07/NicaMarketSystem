import React from 'react';
import { ShoppingCart, Eye, Check, AlertTriangle } from 'lucide-react';
import { Product } from '../../../types';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  isAdded?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onAddToCart,
  isAdded = false,
}) => {
  const isOutOfStock = product.stock <= 0;
  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Category Pill */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-slate-900/80 backdrop-blur-sm text-white shadow-sm">
          {product.category}
        </span>

        {/* Stock Badge */}
        {isOutOfStock ? (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-sm flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Agotado
          </span>
        ) : product.stock <= 3 ? (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-sm">
            ¡Solo {product.stock}!
          </span>
        ) : null}

        {/* Quick Details Hover Hint */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-slate-900 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            Ver Detalles
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Price */}
          <div>
            <span className="text-xs text-slate-400 block font-medium">Precio</span>
            <span className="text-lg font-extrabold text-slate-900">
              C$ {product.price.toFixed(2)}
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            disabled={isOutOfStock}
            onClick={(e) => onAddToCart(product, e)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : isAdded
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/30'
                : 'bg-slate-900 hover:bg-emerald-600 text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Agregado</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Añadir al carrito</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
