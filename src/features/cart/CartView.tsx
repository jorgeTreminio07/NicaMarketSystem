import React, { useState } from 'react';
import { CartItem, PaymentType } from '../../types';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, Send, CheckCircle2, User, Phone, ShoppingCart, CreditCard, Calendar, Check } from 'lucide-react';
import { generateOrderWhatsAppUrl } from '../../utils/whatsapp';

interface CartViewProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: (customerName: string, customerPhone: string, items: CartItem[], paymentType: PaymentType) => Promise<import('../../types').Order | null>;
  onGoBackToStore: () => void;
  storeWhatsappNumber?: string;
}

export const CartView: React.FC<CartViewProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onGoBackToStore,
  storeWhatsappNumber,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('contado');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<{
    success: boolean;
    whatsappUrl: string;
    customerName: string;
    orderNumber?: string;
  } | null>(null);

  const getItemEffectivePrice = (prod: import('../../types').Product) => {
    if (prod.discountPercent && prod.discountPercent > 0) {
      return prod.price * (1 - prod.discountPercent / 100);
    }
    return prod.price;
  };

  const subtotal = items.reduce((sum, item) => sum + getItemEffectivePrice(item.product) * item.quantity, 0);
  const total = subtotal;

  const validateForm = () => {
    const errs: { name?: string; phone?: string } = {};
    if (!customerName.trim()) {
      errs.name = 'Por favor ingrese su nombre completo.';
    }
    if (!customerPhone.trim()) {
      errs.phone = 'Por favor ingrese su número de teléfono.';
    } else if (customerPhone.trim().length < 8) {
      errs.phone = 'Ingrese un número de teléfono válido (mínimo 8 dígitos).';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 1. Send Order request to Backoffice database
      const newOrder = await onCheckout(customerName.trim(), customerPhone.trim(), items, paymentType);

      if (newOrder) {
        // 2. Generate WhatsApp URL for target store number
        const whatsappUrl = generateOrderWhatsAppUrl(
          customerName.trim(),
          customerPhone.trim(),
          items,
          total,
          newOrder.orderNumber,
          paymentType,
          storeWhatsappNumber
        );

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');

        setOrderCompleted({
          success: true,
          whatsappUrl,
          customerName: customerName.trim(),
          orderNumber: newOrder.orderNumber
        });

        // Clear cart items
        onClearCart();
      }
    } catch (err) {
      console.error('Error procesando la compra:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderCompleted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">
              ¡Pedido Registrado con Éxito!
            </h2>
            <p className="text-sm text-slate-600">
              Gracias <strong className="text-slate-900">{orderCompleted.customerName}</strong>. Tu solicitud ha sido enviada al Backoffice y se ha abierto WhatsApp para notificar a nuestro equipo.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left text-xs text-emerald-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>1. Solicitud recibida en Backoffice</span>
            </p>
            <p className="font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>2. Mensaje de WhatsApp listo para enviar al +{storeWhatsappNumber || '50589098184'}</span>
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={orderCompleted.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Abrir WhatsApp Nuevamente</span>
            </a>

            <button
              onClick={onGoBackToStore}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              Volver a la Tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onGoBackToStore}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la tienda</span>
        </button>

        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar Carrito</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Carrito de Compras</h1>
          <p className="text-xs text-slate-500">
            Revisa los productos seleccionados e ingresa tus datos para procesar la compra.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Tu carrito está vacío</h3>
          <p className="text-xs text-slate-500">
            Explora nuestro catálogo y agrega tus productos favoritos.
          </p>
          <button
            onClick={onGoBackToStore}
            className="px-6 py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
          >
            <span>Ir a comprar</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Productos en tu Carrito</span>
              <span className="text-xs text-slate-500 font-normal">
                {items.reduce((sum, item) => sum + item.quantity, 0)} artículos
              </span>
            </h2>

            <div className="divide-y divide-slate-100">
              {items.map(item => {
                const itemImage = item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                const effectiveUnitPrice = getItemEffectivePrice(item.product);
                const hasDiscount = Boolean(item.product.discountPercent && item.product.discountPercent > 0);
                const itemTotal = effectiveUnitPrice * item.quantity;

                return (
                  <div key={item.product.id} className="py-4 flex items-center gap-4">
                    {/* Image */}
                    <img
                      src={itemImage}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                        {hasDiscount && (
                          <span className="line-through text-slate-400 font-medium">
                            C$ {item.product.price.toFixed(2)}
                          </span>
                        )}
                        <span className={`font-bold ${hasDiscount ? 'text-rose-600' : 'text-slate-800'}`}>
                          C$ {effectiveUnitPrice.toFixed(2)} c/u
                        </span>
                        {hasDiscount && (
                          <span className="bg-rose-100 text-rose-800 font-extrabold text-[10px] px-1.5 py-0.5 rounded">
                            -{item.product.discountPercent}%
                          </span>
                        )}
                        <span>•</span>
                        <span className="text-emerald-600">{item.product.category}</span>
                      </p>
                      <div className="text-xs font-extrabold text-slate-900 mt-1">
                        Subtotal: C$ {itemTotal.toFixed(2)}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shrink-0">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 disabled:opacity-40 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Checkout Form & Order Summary */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Datos para Procesar la Compra
            </h2>

            <form onSubmit={handleBuy} className="space-y-4">
              {/* Customer Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nombre Completo *</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => {
                    setCustomerName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Ej. Juan Pérez López"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all ${
                    errors.name
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.name}</p>}
              </div>

              {/* Customer Phone Number */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Número de Teléfono *</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => {
                    setCustomerPhone(e.target.value);
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="Ej. 89098184 o +505 89098184"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none transition-all ${
                    errors.phone
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {errors.phone && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.phone}</p>}
              </div>

              {/* Payment Option Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Modalidad de Pago *</span>
                </label>

                <div className="space-y-2">
                  {/* De Contado */}
                  <label
                    onClick={() => setPaymentType('contado')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentType === 'contado'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600/30'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentType === 'contado' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                        {paymentType === 'contado' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">De Contado</p>
                        <p className="text-[11px] text-slate-500">1 solo pago al recibir</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">
                      C$ {total.toFixed(2)}
                    </span>
                  </label>

                  {/* 2 Cuotas Quincenales */}
                  <label
                    onClick={() => setPaymentType('cuotas_2')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentType === 'cuotas_2'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600/30'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentType === 'cuotas_2' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                        {paymentType === 'cuotas_2' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">A Cuotas - 2 Pagos Quincenales</p>
                        <p className="text-[11px] text-slate-500">1 pago cada 15 días</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-700 block">
                        2x C$ {(total / 2).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">Total: C$ {total.toFixed(2)}</span>
                    </div>
                  </label>

                  {/* 4 Cuotas Semanales */}
                  <label
                    onClick={() => setPaymentType('cuotas_4')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentType === 'cuotas_4'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600/30'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentType === 'cuotas_4' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                        {paymentType === 'cuotas_4' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">A Cuotas - 4 Pagos Semanales</p>
                        <p className="text-[11px] text-slate-500">1 pago cada semana</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-700 block">
                        4x C$ {(total / 4).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">Total: C$ {total.toFixed(2)}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal de Productos:</span>
                  <span className="font-semibold text-slate-900">C$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Envío & Coordinación:</span>
                  <span className="font-semibold text-emerald-600">Gratis por WhatsApp</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900">
                  <span>Total a Pagar:</span>
                  <span className="text-emerald-600">C$ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Notice */}
              <p className="text-[11px] text-slate-400 leading-normal">
                Al hacer clic en <strong className="text-slate-600">Comprar</strong>, tu pedido se guardará en la lista de solicitudes del Backoffice y se abrirá un chat de WhatsApp con el número <strong className="text-slate-600">+{storeWhatsappNumber || '50589098184'}</strong>.
              </p>

              {/* Submit Buy Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Procesando pedido...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Comprar y Enviar por WhatsApp</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
