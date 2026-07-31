import React, { useState } from 'react';
import { Order, PaymentType } from '../../../types';
import { CheckCircle2, XCircle, Clock, Send, Phone, User, Calendar, MessageSquare, Trash2, CreditCard, Search, CalendarDays, Receipt } from 'lucide-react';
import { generateApprovalWhatsAppUrl, generateRejectionWhatsAppUrl, formatPaymentMethodText } from '../../../utils/whatsapp';

interface OrdersSectionProps {
  orders: Order[];
  onApproveOrder: (orderId: string, paymentType?: PaymentType) => Promise<void>;
  onRejectOrder: (orderId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onUpdatePaymentType?: (orderId: string, paymentType: PaymentType) => Promise<void>;
  isLoading: boolean;
}

export const OrdersSection: React.FC<OrdersSectionProps> = ({
  orders,
  onApproveOrder,
  onRejectOrder,
  onDeleteOrder,
  onUpdatePaymentType,
  isLoading,
}) => {
  const [filterStatus, setFilterStatus] = useState<'Pendiente' | 'Aprobado' | 'Rechazado' | 'Todas'>('Pendiente');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<Record<string, PaymentType>>({});

  const pendingCount = orders.filter(o => o.status === 'Pendiente').length;
  const approvedCount = orders.filter(o => o.status === 'Aprobado').length;
  const rejectedCount = orders.filter(o => o.status === 'Rechazado').length;

  const filteredOrders = orders.filter(order => {
    // Filter by status tab
    if (filterStatus !== 'Todas' && order.status !== filterStatus) {
      return false;
    }

    // Filter by search term (Order Number, Customer Name, Customer Phone)
    if (searchTerm.trim().length > 0) {
      const term = searchTerm.trim().toLowerCase();
      const numMatch = (order.orderNumber || '').toLowerCase().includes(term);
      const idMatch = order.id.toLowerCase().includes(term);
      const nameMatch = order.customerName.toLowerCase().includes(term);
      const phoneMatch = order.customerPhone.toLowerCase().includes(term);

      return numMatch || idMatch || nameMatch || phoneMatch;
    }

    return true;
  });

  const handlePaymentTypeChange = async (order: Order, newType: PaymentType) => {
    setSelectedPaymentTypes(prev => ({ ...prev, [order.id]: newType }));
    if (onUpdatePaymentType) {
      try {
        await onUpdatePaymentType(order.id, newType);
      } catch (err) {
        console.error('Error actualizando forma de pago:', err);
      }
    }
  };

  const handleApprove = async (order: Order) => {
    setProcessingId(order.id);
    const paymentTypeToUse = selectedPaymentTypes[order.id] || order.paymentType || 'contado';
    try {
      await onApproveOrder(order.id, paymentTypeToUse);
      const updatedOrder: Order = { ...order, paymentType: paymentTypeToUse, status: 'Aprobado' };
      const whatsappUrl = generateApprovalWhatsAppUrl(updatedOrder);
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error('Error al aprobar orden:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (order: Order) => {
    setProcessingId(order.id);
    try {
      await onRejectOrder(order.id);
      const whatsappUrl = generateRejectionWhatsAppUrl(order);
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error('Error al rechazar orden:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (order: Order) => {
    if (order.status === 'Pendiente') {
      alert('Las solicitudes en estado Pendiente no pueden ser eliminadas. Primero debes aprobarla o rechazarla.');
      return;
    }

    const confirmDelete = window.confirm(
      `¿Deseas eliminar la solicitud N° ${order.orderNumber || order.id.slice(0, 8)} de ${order.customerName}?\n\nEsta acción realizará un borrado lógico y la ocultará del historial.`
    );

    if (!confirmDelete) return;

    setProcessingId(order.id);
    try {
      await onDeleteOrder(order.id);
    } catch (err) {
      console.error('Error al eliminar orden:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation Tabs */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Gestión de Solicitudes</h2>
            <p className="text-xs text-slate-500">
              {filterStatus === 'Pendiente' && 'Mostrando únicamente solicitudes pendientes por aprobar. Al aprobar, el stock de cada producto se restará automáticamente.'}
              {filterStatus === 'Aprobado' && 'Mostrando solicitudes aprobadas. El stock de los productos asociados ya fue restado del inventario.'}
              {filterStatus === 'Rechazado' && 'Mostrando solicitudes rechazadas. Ningún producto de estas órdenes afectó el stock.'}
              {filterStatus === 'Todas' && 'Mostrando el historial completo de solicitudes recibidas.'}
            </p>
          </div>
        </div>

        {/* Search Bar & Tab Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por N° de solicitud, cliente o teléfono..."
              className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterStatus('Pendiente')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                filterStatus === 'Pendiente'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                filterStatus === 'Pendiente' ? 'bg-slate-950 text-amber-400' : 'bg-amber-100 text-amber-900'
              }`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus('Aprobado')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                filterStatus === 'Aprobado'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprobadas</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                filterStatus === 'Aprobado' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {approvedCount}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus('Rechazado')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                filterStatus === 'Rechazado'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rechazadas</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                filterStatus === 'Rechazado' ? 'bg-white text-rose-800' : 'bg-rose-100 text-rose-900'
              }`}>
                {rejectedCount}
              </span>
            </button>

            <button
              onClick={() => setFilterStatus('Todas')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 border ${
                filterStatus === 'Todas'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span>Todas ({orders.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <Clock className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Cargando solicitudes...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-6">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No hay solicitudes en esta sección</h3>
          <p className="text-xs text-slate-500 mt-1">
            Cuando los clientes realicen compras en la tienda, aparecerán aquí inmediatamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const isPending = order.status === 'Pendiente';
            const isApproved = order.status === 'Aprobado';
            const isRejected = order.status === 'Rechazado';
            const isBusy = processingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4 transition-all hover:border-slate-300"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      Solicitud N° {order.orderNumber || order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleString('es-NI', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  {/* Status badge */}
                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> Pendiente
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Aprobado & Stock Restado
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rechazado
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Details & Items Table */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Customer Info Box */}
                  <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Datos del Cliente:</h4>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium flex items-center gap-2 mt-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{order.customerPhone}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Modalidad de Pago:</span>
                        </h4>
                      </div>

                      {/* Payment Type Selector (Admin can edit!) */}
                      <select
                        value={selectedPaymentTypes[order.id] || order.paymentType || 'contado'}
                        onChange={e => handlePaymentTypeChange(order, e.target.value as PaymentType)}
                        className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="contado">💵 De Contado (C$ {order.total.toFixed(2)})</option>
                        <option value="cuotas_2">🗓️ 2 Cuotas Quincenales (2x C$ {(order.total / 2).toFixed(2)})</option>
                        <option value="cuotas_4">🗓️ 4 Cuotas Semanales (4x C$ {(order.total / 4).toFixed(2)})</option>
                      </select>

                      <p className="text-[11px] text-emerald-700 font-semibold mt-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200/60">
                        {formatPaymentMethodText(selectedPaymentTypes[order.id] || order.paymentType || 'contado', order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div className="md:col-span-7 space-y-2">
                    <h4 className="text-xs font-bold uppercase text-slate-400">Detalle de Productos Solicitados:</h4>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 divide-y divide-slate-200/60">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              {item.quantity}x
                            </span>
                            <span className="font-semibold text-slate-900">{item.productName}</span>
                          </div>
                          <span className="font-extrabold text-slate-800">
                            C$ {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 px-1 text-sm font-extrabold text-slate-900">
                      <span>Total de la Solicitud:</span>
                      <span className="text-emerald-600 text-lg">C$ {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    {isPending && 'Acción requerida: Aprueba o rechaza la solicitud para habilitar su eliminación o procesamiento.'}
                    {isApproved && 'Orden aprobada y stock ajustado. Ya puedes eliminarla del historial si lo deseas.'}
                    {isRejected && 'Orden rechazada. Puedes eliminarla del historial.'}
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <>
                        <button
                          disabled={isBusy}
                          onClick={() => handleReject(order)}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Rechazar</span>
                        </button>

                        <button
                          disabled={isBusy}
                          onClick={() => handleApprove(order)}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aprobar y Notificar por WhatsApp</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            const url = isApproved 
                              ? generateApprovalWhatsAppUrl(order)
                              : generateRejectionWhatsAppUrl(order);
                            window.open(url, '_blank');
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Re-enviar WhatsApp</span>
                        </button>

                        <button
                          disabled={isBusy}
                          onClick={() => handleDelete(order)}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                          title="Eliminar solicitud lógicamente"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Eliminar Solicitud</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
