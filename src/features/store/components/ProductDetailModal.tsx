import React, { useState } from 'react';
import { X, ShoppingCart, Check, ShieldCheck, Truck, Package, AlertTriangle, Plus, Minus } from 'lucide-react';
import { Product } from '../../../types';
import { ImageCarousel } from './ImageCarousel';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-8 animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all shadow-sm"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          {/* Left Column: Image Carousel */}
          <div>
            <ImageCarousel images={product.images} altText={product.name} />
          </div>

          {/* Right Column: Detailed Product Information */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Category */}
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {product.category}
                </span>
                {isOutOfStock ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Agotado
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-emerald-600" /> {product.stock} disponibles
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
                {product.name}
              </h2>

              {/* Price */}
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">
                  C$ {product.price.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400 font-medium">Córdobas</span>
              </div>

              {/* Description */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Descripción del Producto
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Extra Perks */}
              <div className="mt-5 space-y-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Envío rápido y coordinado vía WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Garantía de satisfacción y pago seguro</span>
                </div>
              </div>
            </div>

            {/* Bottom Controls: Quantity & Add to Cart */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
              {!isOutOfStock && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Cantidad:</span>
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-lg bg-white shadow-xs hover:bg-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-40 transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock}
                      className="w-8 h-8 rounded-lg bg-white shadow-xs hover:bg-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-40 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <button
                disabled={isOutOfStock}
                onClick={handleAdd}
                className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : addedSuccess
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                    : 'bg-slate-900 hover:bg-emerald-600 text-white shadow-slate-900/10'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    <span>¡Añadido al carrito!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Añadir al carrito</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
