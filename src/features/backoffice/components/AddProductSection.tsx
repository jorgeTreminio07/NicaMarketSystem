import React, { useState } from 'react';
import { Product } from '../../../types';
import { Plus, Image as ImageIcon, CheckCircle2, Trash2, Sparkles, Tag, DollarSign, Package, FileText } from 'lucide-react';

interface AddProductSectionProps {
  onAddProduct: (newProductData: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
  existingCategories: string[];
}

export const AddProductSection: React.FC<AddProductSectionProps> = ({
  onAddProduct,
  existingCategories,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [discountPercent, setDiscountPercent] = useState<number | string>(0);
  const [stock, setStock] = useState<number | string>(10);
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
  ]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddImageUrl = () => {
    if (newUrlInput.trim()) {
      setImageUrls(prev => [...prev, newUrlInput.trim()]);
      setNewUrlInput('');
    }
  };

  const handleRemoveImageUrl = (index: number) => {
    if (imageUrls.length <= 1) {
      alert('Debes incluir al menos una imagen.');
      return;
    }
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === 'NUEVA' ? customCategory.trim() : category.trim();

    if (!name.trim() || !finalCategory || price === '' || stock === '') {
      alert('Por favor completa los campos requeridos (*).');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      await onAddProduct({
        name: name.trim(),
        category: finalCategory,
        price: Math.max(0, Number(price) || 0),
        discountPercent: Math.min(100, Math.max(0, Number(discountPercent) || 0)),
        stock: Math.max(0, Number(stock) || 0),
        description: description.trim(),
        images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
      });

      setSuccessMessage(`¡Producto "${name.trim()}" publicado exitosamente en la tienda!`);

      // Reset form
      setName('');
      setCategory('');
      setCustomCategory('');
      setPrice('');
      setDiscountPercent(0);
      setStock(10);
      setDescription('');
      setImageUrls(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80']);
    } catch (err) {
      console.error('Error al agregar el producto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Agregar Nuevo Producto</h2>
            <p className="text-xs text-slate-500">
              Registra un nuevo producto en el catálogo. Se organizará alfabéticamente en la tienda.
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nombre del Producto *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Tenis Deportivos Ultra Flex"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Category Selector / New Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Categoría *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">-- Selecciona Categoría --</option>
                {existingCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="NUEVA">+ Crear Nueva Categoría</option>
              </select>
            </div>

            {category === 'NUEVA' && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Nombre de la Nueva Categoría *
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="Ej. Joyería, Tecnología..."
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Price, Discount & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Precio Regular (C$) *</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-rose-600 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                <span>% Descuento (0-100)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={e => setDiscountPercent(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-sm font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Stock Inicial *</span>
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="10"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Descripción del Producto</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe las características principales, materiales, especificaciones, etc..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Images Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Galería de Imágenes para el Carrusel</span>
            </label>

            <div className="flex gap-2">
              <input
                type="url"
                value={newUrlInput}
                onChange={e => setNewUrlInput(e.target.value)}
                placeholder="URL de imagen (Ej: https://images.unsplash.com/...)"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Foto</span>
              </button>
            </div>

            {/* List of Images */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                  <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImageUrl(idx)}
                    className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-slate-900/80 text-[9px] font-bold text-white">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-slate-900 hover:bg-emerald-600 text-white text-sm font-extrabold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Publicando producto...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Publicar Producto en la Tienda</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
