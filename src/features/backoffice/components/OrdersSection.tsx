import React, { useState, useEffect, useRef } from 'react';
import { Order, PaymentType } from '../../../types';
import { CheckCircle2, XCircle, Clock, Send, Phone, User, Calendar, MessageSquare, Trash2, Search, X, Eye, ShoppingBag } from 'lucide-react';
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
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  
  // Charge 10 by 10 automatically on scroll
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Reset pagination when status or search term changes
  useEffect(() => {
    setVisibleCount(10);
  }, [filterStatus, searchTerm]);

  // Sort orders newest first
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const pendingCount = sortedOrders.filter(o => o.status === 'Pendiente').length;
  const approvedCount = sortedOrders.filter(o => o.status === 'Aprobado').length;
  const rejectedCount = sortedOrders.filter(o => o.status === 'Rechazado').length;

  const filteredOrders = sortedOrders.filter(order => {
    // Filter by status tab
    if (filterStatus !== 'Todas' && order.status !== filterStatus) {
      return false;
    }

    // Filter by search term
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

  const visibleOrders = filteredOrders.slice(0, visibleCount);

  // Automatic Infinite Scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredOrders.length) {
          setVisibleCount(prev => prev + 10);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, filteredOrders.length]);

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
      setSelectedOrderForModal(null);
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
      setSelectedOrderForModal(null);
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
      `¿Deseas eliminar la solicitud N° ${order.orderNumber || order.id.slice(0, 8)} de ${order.customerName}?\n\nEsta acción realizará un borrado lógico, la ocultará del historial y devolverá el stock si estaba aprobada.`
    );

    if (!confirmDelete) return;

    setProcessingId(order.id);
    try {
      await onDeleteOrder(order.id);
      setSelectedOrderForModal(null);
    } catch (err) {
      console.error('Error al eliminar orden:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Gestión de Solicitudes</h2>
            <p className="text-xs text-slate-500">
              {filterStatus === 'Pendiente' && 'Mostrando únicamente solicitudes pendientes por aprobar (ordenadas por fecha más reciente).'}
              {filterStatus === 'Aprobado' && 'Mostrando solicitudes aprobadas.'}
              {filterStatus === 'Rechazado' && 'Mostrando solicitudes rechazadas.'}
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

      {/* 2-COLUMN GRID OF COMPACT CARDS */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleOrders.map(order => {
              const isPending = order.status === 'Pendiente';
              const isApproved = order.status === 'Aprobado';
              const isRejected = order.status === 'Rechazado';
              const totalItems = order.items ? order.items.reduce((sum, i) => sum + i.quantity, 0) : 0;

              // Format date cleanly: e.g. "30/07/2026, 17:42"
              const formattedDate = new Date(order.createdAt).toLocaleDateString('es-NI', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderForModal(order)}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500/50 p-4 transition-all cursor-pointer flex flex-col justify-between group space-y-3"
                >
                  {/* Header: N° Solicitud + FECHA DE SOLICITUD & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        Solicitud N° {order.orderNumber || order.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{formattedDate}</span>
                      </span>
                    </div>

                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprobado
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" /> Rechazado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer name & Phone */}
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{order.customerName}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{order.customerPhone}</span>
                    </div>
                  </div>

                  {/* Info Pills & Price */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-slate-400" />
                        <span>{totalItems} producto{totalItems !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="inline-block text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {order.paymentType === 'cuotas_2' && '2 Cuotas'}
                        {order.paymentType === 'cuotas_4' && '4 Cuotas'}
                        {(!order.paymentType || order.paymentType === 'contado') && 'Contado'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Monto Total:</span>
                      <span className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                        C$ {order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Click action indicator */}
                  <button
                    type="button"
                    className="w-full py-2 bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200 group-hover:border-emerald-600"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Detalle y Gestionar</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Sentinel element for infinite scroll */}
          {visibleCount < filteredOrders.length && (
            <div ref={loadMoreRef} className="py-4 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Cargando más solicitudes automáticamente...</span>
            </div>
          )}
        </div>
      )}

      {/* DETAIL AND ACTION MODAL FOR A SELECTED ORDER */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-extrabold text-emerald-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                  N° {selectedOrderForModal.orderNumber || selectedOrderForModal.id.slice(0, 8)}
                </span>
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {new Date(selectedOrderForModal.createdAt).toLocaleString('es-NI', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Status Badge Banner */}
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600">Estado Actual de la Solicitud:</span>
                <div>
                  {selectedOrderForModal.status === 'Pendiente' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" /> Pendiente
                    </span>
                  )}
                  {selectedOrderForModal.status === 'Aprobado' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Aprobado & Stock Restado
                    </span>
                  )}
                  {selectedOrderForModal.status === 'Rechazado' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rechazado
                    </span>
                  )}
                </div>
              </div>

              {/* Customer Box & Payment Method selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Datos del Cliente:</h4>
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{selectedOrderForModal.customerName}</span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{selectedOrderForModal.customerPhone}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Modalidad de Pago:</h4>
                  <select
                    value={selectedPaymentTypes[selectedOrderForModal.id] || selectedOrderForModal.paymentType || 'contado'}
                    onChange={e => handlePaymentTypeChange(selectedOrderForModal, e.target.value as PaymentType)}
                    className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="contado">De Contado (C$ {selectedOrderForModal.total.toFixed(2)})</option>
                    <option value="cuotas_2">2 Cuotas Quincenales (2x C$ {(selectedOrderForModal.total / 2).toFixed(2)})</option>
                    <option value="cuotas_4">4 Cuotas Semanales (4x C$ {(selectedOrderForModal.total / 4).toFixed(2)})</option>
                  </select>
                  <p className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200/60">
                    {formatPaymentMethodText(selectedPaymentTypes[selectedOrderForModal.id] || selectedOrderForModal.paymentType || 'contado', selectedOrderForModal.total)}
                  </p>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Detalle de Productos Solicitados:</h4>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 divide-y divide-slate-200/80">
                  {selectedOrderForModal.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                          {item.quantity}x
                        </span>
                        <span className="font-semibold text-slate-900">{item.productName}</span>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        C$ {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 px-1 text-sm font-extrabold text-slate-900">
                  <span>Total de la Solicitud:</span>
                  <span className="text-emerald-600 text-xl font-black">C$ {selectedOrderForModal.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                {selectedOrderForModal.status === 'Pendiente' ? (
                  <>
                    <button
                      disabled={processingId === selectedOrderForModal.id}
                      onClick={() => handleReject(selectedOrderForModal)}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rechazar</span>
                    </button>

                    <button
                      disabled={processingId === selectedOrderForModal.id}
                      onClick={() => handleApprove(selectedOrderForModal)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprobar y Notificar</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const url = selectedOrderForModal.status === 'Aprobado' 
                          ? generateApprovalWhatsAppUrl(selectedOrderForModal)
                          : generateRejectionWhatsAppUrl(selectedOrderForModal);
                        window.open(url, '_blank');
                      }}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Re-enviar WhatsApp</span>
                    </button>

                    <button
                      disabled={processingId === selectedOrderForModal.id}
                      onClick={() => handleDelete(selectedOrderForModal)}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 shadow-md shadow-rose-600/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Solicitud</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
