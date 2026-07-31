import React, { useState } from 'react';
import { Order } from '../../../types';
import { orderRepository } from '../../../infrastructure/api/apiClient';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  PlusCircle,
  Calendar,
  User,
  Phone,
  X,
  History,
  AlertCircle,
  Pencil,
  Trash2,
  Eye,
  TrendingUp,
  FileText
} from 'lucide-react';

interface CreditManagementSectionProps {
  orders: Order[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const CreditManagementSection: React.FC<CreditManagementSectionProps> = ({
  orders,
  onRefresh,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'En Proceso' | 'Pagado' | 'En Mora'>('Todos');
  
  // Modal state for viewing credit detail
  const [selectedCreditForModal, setSelectedCreditForModal] = useState<Order | null>(null);

  // Modal state for adding an abono
  const [selectedOrderForAbono, setSelectedOrderForAbono] = useState<Order | null>(null);
  const [abonoAmount, setAbonoAmount] = useState<string>('');
  const [abonoNote, setAbonoNote] = useState<string>('');

  // Modal state for editing an abono
  const [editingAbono, setEditingAbono] = useState<{
    orderId: string;
    abonoId: string;
    customerName: string;
    orderNumber: string;
    amount: string;
    note: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter only approved orders for credit tracking
  const approvedOrders = orders.filter(o => o.status === 'Aprobado');

  // Counts
  const inProcessCount = approvedOrders.filter(o => (o.creditStatus || 'En Proceso') === 'En Proceso').length;
  const paidCount = approvedOrders.filter(o => o.creditStatus === 'Pagado').length;
  const overdueCount = approvedOrders.filter(o => o.creditStatus === 'En Mora').length;

  const totalPortfolioValue = approvedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCollected = approvedOrders.reduce((sum, o) => sum + (o.totalPaid || 0), 0);
  const totalPending = Math.max(0, totalPortfolioValue - totalCollected);

  // Filtered orders list
  const filteredOrders = approvedOrders.filter(order => {
    const cStatus = order.creditStatus || 'En Proceso';

    if (statusFilter !== 'Todos' && cStatus !== statusFilter) {
      return false;
    }

    if (searchTerm.trim().length > 0) {
      const term = searchTerm.trim().toLowerCase();
      const numMatch = (order.orderNumber || '').toLowerCase().includes(term);
      const nameMatch = order.customerName.toLowerCase().includes(term);
      const phoneMatch = order.customerPhone.toLowerCase().includes(term);
      const idMatch = order.id.toLowerCase().includes(term);

      return numMatch || nameMatch || phoneMatch || idMatch;
    }

    return true;
  });

  const handleOpenAbonoModal = (order: Order) => {
    // REQUIREMENT: If order is already paid, do NOT allow adding more abonos!
    const totalPaid = order.totalPaid || 0;
    const remainingBalance = Math.max(0, order.total - totalPaid);
    if (order.creditStatus === 'Pagado' || remainingBalance <= 0) {
      alert('Esta solicitud ya ha sido pagada en su totalidad. No es posible registrar más abonos.');
      return;
    }

    setSelectedOrderForAbono(order);
    // Default abono amount to next installment amount or remaining balance
    const nextUnpaidInstallment = order.paymentSchedule?.find(s => s.status !== 'Pagado');
    const defaultAmount = nextUnpaidInstallment ? nextUnpaidInstallment.expectedAmount : remainingBalance;
    setAbonoAmount(defaultAmount > 0 ? defaultAmount.toString() : '');
    setAbonoNote('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleCloseModal = () => {
    setSelectedOrderForAbono(null);
    setAbonoAmount('');
    setAbonoNote('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleAddAbonoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForAbono) return;

    const numAmount = parseFloat(abonoAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await orderRepository.addAbono(
        selectedOrderForAbono.id,
        numAmount,
        abonoNote
      );

      setSuccessMessage(result.message);
      onRefresh(); // Refresh parent state
      
      // Update modal order if viewing detail modal
      if (selectedCreditForModal && selectedCreditForModal.id === selectedOrderForAbono.id) {
        setSelectedCreditForModal(result.order);
      }

      setTimeout(() => {
        handleCloseModal();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el abono';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditAbonoModal = (order: Order, abono: { id: string; amount: number; note?: string }) => {
    setEditingAbono({
      orderId: order.id,
      abonoId: abono.id,
      customerName: order.customerName,
      orderNumber: order.orderNumber || order.id.slice(0, 8),
      amount: abono.amount.toString(),
      note: abono.note || ''
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleCloseEditModal = () => {
    setEditingAbono(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleEditAbonoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAbono) return;

    const numAmount = parseFloat(editingAbono.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await orderRepository.updateAbono(
        editingAbono.orderId,
        editingAbono.abonoId,
        numAmount,
        editingAbono.note
      );

      setSuccessMessage(result.message);
      onRefresh();
      
      if (selectedCreditForModal && selectedCreditForModal.id === editingAbono.orderId) {
        setSelectedCreditForModal(result.order);
      }

      setTimeout(() => {
        handleCloseEditModal();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al modificar el abono';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAbono = async (orderId: string, abonoId: string, amount: number) => {
    const confirmDelete = window.confirm(
      `¿Deseas eliminar este abono de C$ ${amount.toFixed(2)}?\nEl estado de crédito y el saldo de la solicitud serán recalculados automáticamente.`
    );

    if (!confirmDelete) return;

    try {
      const result = await orderRepository.deleteAbono(orderId, abonoId);
      onRefresh();

      if (selectedCreditForModal && selectedCreditForModal.id === orderId) {
        setSelectedCreditForModal(result.order);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar el abono';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total en Cartera</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">C$ {totalPortfolioValue.toFixed(2)}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">{approvedOrders.length} solicitudes aprobadas</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Recaudado / Cobrado</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">C$ {totalCollected.toFixed(2)}</h3>
            <p className="text-[10px] text-emerald-700 font-bold mt-1">
              {totalPortfolioValue > 0 ? Math.round((totalCollected / totalPortfolioValue) * 100) : 0}% recuperado
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pendiente por Cobrar</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">C$ {totalPending.toFixed(2)}</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">{inProcessCount + overdueCount} cuentas por cobrar</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Header Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Cartera de Abonos y Cobros</h2>
            <p className="text-xs text-slate-500">
              Control general de solicitudes aprobadas, abonos recibidos, cuotas programadas y estados de saldo.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, N° de solicitud o teléfono..."
              className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('Todos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                statusFilter === 'Todos'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Todos ({approvedOrders.length})
            </button>

            <button
              onClick={() => setStatusFilter('En Proceso')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                statusFilter === 'En Proceso'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>En Proceso ({inProcessCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('Pagado')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                statusFilter === 'Pagado'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pagados ({paidCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('En Mora')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                statusFilter === 'En Mora'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>En Mora ({overdueCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-COLUMN GRID OF COMPACT CREDIT CARDS */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <Clock className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Cargando cartera de abonos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-6">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No hay solicitudes registradas en cartera</h3>
          <p className="text-xs text-slate-500 mt-1">
            Las solicitudes aprobadas aparecerán aquí automáticamente para gestionar sus abonos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map(order => {
            const totalPaid = order.totalPaid || 0;
            const remainingBalance = Math.max(0, order.total - totalPaid);
            const isPagado = order.creditStatus === 'Pagado' || remainingBalance <= 0;
            const isEnMora = order.creditStatus === 'En Mora';
            const progressPercent = Math.min(100, Math.round((totalPaid / (order.total || 1)) * 100));

            return (
              <div
                key={order.id}
                onClick={() => setSelectedCreditForModal(order)}
                className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-3 ${
                  isPagado 
                    ? 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/10'
                    : isEnMora
                    ? 'border-rose-200 hover:border-rose-400 bg-rose-50/10'
                    : 'border-slate-200 hover:border-emerald-500/50'
                }`}
              >
                {/* Header: Solicitud N° & Credit Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    Solicitud N° {order.orderNumber || order.id.slice(0, 8)}
                  </span>

                  <div>
                    {isPagado && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAGADO
                      </span>
                    )}
                    {isEnMora && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> EN MORA
                      </span>
                    )}
                    {!isPagado && !isEnMora && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3 h-3 text-amber-700" /> EN PROCESO
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

                {/* Progress Bar & Balances */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-slate-500">Avance de Pago:</span>
                    <span className="text-emerald-700">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPagado ? 'bg-emerald-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] text-center">
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Total</span>
                      <span className="font-extrabold text-slate-900">C$ {order.total.toFixed(0)}</span>
                    </div>
                    <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                      <span className="text-[9px] font-extrabold uppercase text-emerald-800 block">Abonado</span>
                      <span className="font-extrabold text-emerald-700">C$ {totalPaid.toFixed(0)}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                      <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Falta</span>
                      <span className={`font-extrabold ${remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        C$ {remainingBalance.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <button
                  type="button"
                  className="w-full py-2 bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200 group-hover:border-emerald-600"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Detalle y Abonos</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL FOR A SELECTED CREDIT ORDER */}
      {selectedCreditForModal && (() => {
        const order = selectedCreditForModal;
        const totalPaid = order.totalPaid || 0;
        const remainingBalance = Math.max(0, order.total - totalPaid);
        const isPagado = order.creditStatus === 'Pagado' || remainingBalance <= 0;
        const isEnMora = order.creditStatus === 'En Mora';
        const progressPercent = Math.min(100, Math.round((totalPaid / (order.total || 1)) * 100));

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-extrabold text-emerald-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                    N° {order.orderNumber || order.id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    Cliente: <strong>{order.customerName}</strong> ({order.customerPhone})
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCreditForModal(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Credit Status & Progress Banner */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-extrabold text-slate-900">{order.customerName}</span>
                      <span className="text-xs text-slate-500 font-medium">({order.customerPhone})</span>
                    </div>

                    <div>
                      {isPagado && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SOLICITUD TOTALMENTE PAGADA
                        </span>
                      )}
                      {isEnMora && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> EN MORA
                        </span>
                      )}
                      {!isPagado && !isEnMora && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-700" /> EN PROCESO DE PAGO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Total de la Deuda</span>
                      <span className="text-base font-black text-slate-900">C$ {order.total.toFixed(2)}</span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] font-black uppercase text-emerald-800 block">Total Abonado</span>
                      <span className="text-base font-black text-emerald-700">C$ {totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Saldo Restante</span>
                      <span className={`text-base font-black ${remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        C$ {remainingBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>Progreso de Cancelación:</span>
                      <span className="text-emerald-700 font-extrabold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPagado ? 'bg-emerald-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule & Payment History */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Cronograma de Pagos */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Fechas de Pago ({order.paymentSchedule?.length || 0} cuotas):</span>
                    </h4>

                    {(!order.paymentSchedule || order.paymentSchedule.length === 0) ? (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                        Sin fechas programadas (Pago de contado).
                      </p>
                    ) : (
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-200 max-h-60 overflow-y-auto">
                        {order.paymentSchedule.map(item => {
                          const isItemPaid = item.status === 'Pagado';
                          const isItemOverdue = item.status === 'Vencido';

                          return (
                            <div
                              key={item.installmentNumber}
                              className={`p-3 text-xs flex items-center justify-between transition-colors ${
                                isItemPaid
                                  ? 'bg-emerald-50/60'
                                  : isItemOverdue
                                  ? 'bg-rose-50/60'
                                  : 'bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-800 bg-slate-200 px-2 py-0.5 rounded-md text-[10px]">
                                  Cuota #{item.installmentNumber}
                                </span>
                                <span className="text-slate-600 font-medium text-[11px]">
                                  {new Date(item.dueDate).toLocaleDateString('es-NI', { dateStyle: 'medium' })}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900">
                                  C$ {item.expectedAmount.toFixed(2)}
                                </span>
                                {isItemPaid && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Pagado
                                  </span>
                                )}
                                {isItemOverdue && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    Vencido
                                  </span>
                                )}
                                {!isItemPaid && !isItemOverdue && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                    Pendiente
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Historial de Abonos */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Historial de Abonos ({order.paymentsHistory?.length || 0}):</span>
                    </h4>

                    {(!order.paymentsHistory || order.paymentsHistory.length === 0) ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                        Aún no se han registrado abonos.
                      </p>
                    ) : (
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200 max-h-60 overflow-y-auto">
                        {order.paymentsHistory.map(abono => (
                          <div key={abono.id} className="p-3 text-xs flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                            <div>
                              <span className="font-bold text-slate-900 block">
                                + C$ {abono.amount.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(abono.date).toLocaleString('es-NI', { dateStyle: 'short', timeStyle: 'short' })}
                                {abono.note && ` — ${abono.note}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditAbonoModal(order, abono)}
                                title="Editar abono"
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 hover:border-emerald-300"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAbono(order.id, abono.id, abono.amount)}
                                title="Eliminar abono"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 hover:border-rose-300"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => setSelectedCreditForModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
                >
                  Cerrar
                </button>

                {/* REQUIREMENT 1: If order is already paid, do NOT render the add abono button */}
                {isPagado ? (
                  <div className="text-xs font-bold text-emerald-800 bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Solicitud Pagada en su totalidad. No requiere más cuotas.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenAbonoModal(order)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Registrar Abono / Cuota</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL FOR REGISTERING ABONO */}
      {selectedOrderForAbono && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm sm:text-base">Registrar Abono / Cuota</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAbonoSubmit} className="p-6 space-y-4">
              {/* Context Summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Cliente:</span>
                  <span>{selectedOrderForAbono.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Solicitud N°:</span>
                  <span>{selectedOrderForAbono.orderNumber || selectedOrderForAbono.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between font-extrabold pt-1 border-t border-slate-200 text-slate-900">
                  <span>Saldo Pendiente:</span>
                  <span className="text-emerald-600">
                    C$ {(selectedOrderForAbono.total - (selectedOrderForAbono.totalPaid || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Monto a Abonar (C$): <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">C$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={abonoAmount}
                    onChange={e => setAbonoAmount(e.target.value)}
                    placeholder="Ej. 25.00"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Note input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Nota / Referencia de Pago (Opcional):
                </label>
                <input
                  type="text"
                  value={abonoNote}
                  onChange={e => setAbonoNote(e.target.value)}
                  placeholder="Ej. Cuota #1 pagada en efectivo o transferencia"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirmar y Guardar Abono</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FOR EDITING AN EXISTING ABONO */}
      {editingAbono && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm sm:text-base">Editar Abono</h3>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditAbonoSubmit} className="p-6 space-y-4">
              {/* Context Summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Cliente:</span>
                  <span>{editingAbono.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Solicitud N°:</span>
                  <span>{editingAbono.orderNumber}</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Nuevo Monto del Abono (C$): <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">C$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editingAbono.amount}
                    onChange={e => setEditingAbono({ ...editingAbono, amount: e.target.value })}
                    placeholder="Ej. 25.00"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Note input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Nota / Referencia de Pago (Opcional):
                </label>
                <input
                  type="text"
                  value={editingAbono.note}
                  onChange={e => setEditingAbono({ ...editingAbono, note: e.target.value })}
                  placeholder="Ej. Corrección de monto o abono parcial"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
