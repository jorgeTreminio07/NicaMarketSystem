import React, { useState, useEffect } from 'react';
import { Product } from '../../../types';
import { X, Save, Image as ImageIcon, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { uploadProductImage } from '../../../infrastructure/supabase/uploadImage';
import { DEFAULT_PRODUCT_IMAGE } from '../../../utils/productUtils';

interface EditProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (id: string, updatedData: Partial<Product>) => Promise<void>;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [discountPercent, setDiscountPercent] = useState<number | string>(0);
  const [stock, setStock] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setPrice(product.price);
      setDiscountPercent(product.discountPercent || 0);
      setStock(product.stock);
      setDescription(product.description);
      setImages(product.images && product.images.length > 0 ? [...product.images] : []);
    }
  }, [product]);

  if (!product) return null;

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages(prev => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const publicUrl = await uploadProductImage({
        file,
        onStatus: (status) => setUploadStatus(status),
      });
      setImages(prev => [...prev, publicUrl]);
    } catch (err: any) {
      setUploadError(err?.message || "No se pudo subir la imagen.");
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === '' || stock === '') return;

    setIsSubmitting(true);
    try {
      await onSave(product.id, {
        name: name.trim(),
        category: category.trim() || 'General',
        price: Number(price) || 0,
        discountPercent: Math.min(100, Math.max(0, Number(discountPercent) || 0)),
        stock: Math.max(0, Number(stock) || 0),
        description: description.trim(),
        images: images.length > 0 ? images : product.images,
      });
      onClose();
    } catch (err) {
      console.error('Error al actualizar el producto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-extrabold text-slate-900 mb-1">
          Editar Producto
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Modifica los datos del producto. Los cambios se actualizarán automáticamente en la tienda.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Categoría *
              </label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
                placeholder="Ej. Electrónica, Calzado..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Precio (C$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-rose-600 mb-1">
                % Descuento (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={e => setDiscountPercent(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-sm font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Stock Disponible *
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Descripción
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Images Management */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Imágenes del Carrusel</span>
            </label>

            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={newImageUrl}
                onChange={e => setNewImageUrl(e.target.value)}
                placeholder="Pegar URL de imagen (https://...)"
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir</span>
              </button>
            </div>

            <div className="flex items-center gap-2 px-1 mb-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                o sube desde tu dispositivo
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? (uploadStatus || "Subiendo...") : "Subir imagen "}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            {isUploading && (
              <div className="flex items-center gap-2 px-1">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span className="text-xs text-slate-500">{uploadStatus || "Procesando..."}</span>
              </div>
            )}
            {uploadError && (
              <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 px-1">
                <span>⚠</span> {uploadError}
              </p>
            )}

            {/* Existing Images Thumbnails */}
            <div className="flex flex-wrap gap-2 pt-1">
              {images.length === 0 ? (
                <div className="flex items-center gap-2 w-40 h-16 rounded-xl overflow-hidden border border-dashed border-slate-300 bg-slate-50 p-1">
                  <img src={DEFAULT_PRODUCT_IMAGE} alt="Imagen por defecto" className="w-14 h-14 rounded-lg object-cover" />
                  <span className="text-[10px] text-slate-500 font-medium leading-tight">
                    Sin imágenes. Se usará la imagen por defecto.
                  </span>
                </div>
              ) : (
                images.map((url, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
