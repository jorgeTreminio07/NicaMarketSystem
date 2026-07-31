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
  FileText,
  X,
  History,
  TrendingUp,
  AlertCircle,
  Pencil,
  Trash2
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
    setSelectedOrderForAbono(order);
    const pendingBalance = Math.max(0, order.total - (order.totalPaid || 0));
    // Default abono amount to next installment amount or remaining balance
    const nextUnpaidInstallment = order.paymentSchedule?.find(s => s.status !== 'Pagado');
    const defaultAmount = nextUnpaidInstallment ? nextUnpaidInstallment.expectedAmount : pendingBalance;
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
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
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

  const handleDeleteAbono = async (orderId: string, abonoId: string, abonoAmount: number) => {
    if (!confirm(`¿Estás seguro de eliminar este abono de C$ ${abonoAmount.toFixed(2)}? El estado del crédito se re-calculará de inmediato.`)) {
      return;
    }

    try {
      await orderRepository.deleteAbono(orderId, abonoId);
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el abono');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Credit Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Recaudado</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            C$ {totalCollected.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            Suma total de abonos registrados
          </p>
        </div>

        {/* Total Pending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo por Cobrar</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            C$ {totalPending.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            De un total financiado de C$ {totalPortfolioValue.toFixed(2)}
          </p>
        </div>

        {/* En Proceso & Mora */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Créditos Activos</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900">{inProcessCount}</p>
            <span className="text-xs font-bold text-slate-500">en proceso</span>
          </div>
          {overdueCount > 0 && (
            <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {overdueCount} en mora
            </p>
          )}
        </div>

        {/* Pagados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Saldados / Pagados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{paidCount}</p>
          <p className="text-[11px] text-slate-400 font-medium">
            Solicitudes con cuotas liquidadas al 100%
          </p>
        </div>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('Todos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                statusFilter === 'Todos'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Todos ({approvedOrders.length})
            </button>

            <button
              onClick={() => setStatusFilter('En Proceso')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                statusFilter === 'En Proceso'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>En Proceso ({inProcessCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('En Mora')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                statusFilter === 'En Mora'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>En Mora ({overdueCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('Pagado')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                statusFilter === 'Pagado'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pagados ({paidCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Credit Cards List */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <Clock className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Cargando estado de créditos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-6">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No hay solicitudes en esta sección de cartera</h3>
          <p className="text-xs text-slate-500 mt-1">
            Aquí aparecerán las solicitudes aprobadas para hacer seguimiento a sus cuotas, abonos y fechas de pago.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const creditStatus = order.creditStatus || 'En Proceso';
            const totalPaid = order.totalPaid || 0;
            const remainingBalance = Math.max(0, order.total - totalPaid);
            const progressPercent = Math.min(100, Math.round((totalPaid / order.total) * 100));

            const isPagado = creditStatus === 'Pagado';
            const isEnMora = creditStatus === 'En Mora';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 space-y-5 transition-all shadow-sm ${
                  isPagado
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : isEnMora
                    ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      Solicitud N° {order.orderNumber || order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Aprobada el {new Date(order.createdAt).toLocaleDateString('es-NI', { dateStyle: 'medium' })}
                    </span>
                  </div>

                  {/* Credit Status Badge */}
                  <div>
                    {isPagado && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        PAGADO / SALDADO
                      </span>
                    )}
                    {isEnMora && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        EN MORA (Cuota Vencida)
                      </span>
                    )}
                    {!isPagado && !isEnMora && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        EN PROCESO DE PAGO
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Customer & Scheme Details */}
                  <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Cliente:</h4>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium flex items-center gap-2 mt-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{order.customerPhone}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <h4 className="text-[11px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Modalidad Seleccionada:</h4>
                      <span className="inline-block px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-800">
                        {order.paymentType === 'cuotas_2' && '🗓️ 2 Cuotas Quincenales'}
                        {order.paymentType === 'cuotas_4' && '🗓️ 4 Cuotas Semanales'}
                        {(!order.paymentType || order.paymentType === 'contado') && '💵 De Contado'}
                      </span>
                    </div>

                    {/* Progress Bar & Balances */}
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600">Avance de Pago:</span>
                        <span className="text-emerald-700">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPagado ? 'bg-emerald-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Abonado</span>
                          <span className="font-black text-emerald-600">C$ {totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Pendiente</span>
                          <span className={`font-black ${remainingBalance > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                            C$ {remainingBalance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Schedule & Abonos Table */}
                  <div className="md:col-span-7 space-y-4">
                    {/* Schedule */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Fechas de Pago Programadas ({order.paymentSchedule?.length || 0} cuotas):</span>
                      </h4>

                      {(!order.paymentSchedule || order.paymentSchedule.length === 0) ? (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                          Sin fechas programadas (Pago de contado o sin cuotas).
                        </p>
                      ) : (
                        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200/80">
                          {order.paymentSchedule.map(item => {
                            const isItemPaid = item.status === 'Pagado';
                            const isItemOverdue = item.status === 'Vencido';

                            return (
                              <div
                                key={item.installmentNumber}
                                className={`p-2.5 sm:px-3 text-xs flex items-center justify-between transition-colors ${
                                  isItemPaid
                                    ? 'bg-emerald-50/50'
                                    : isItemOverdue
                                    ? 'bg-rose-50/60'
                                    : 'bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-800 bg-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                                    Cuota #{item.installmentNumber}
                                  </span>
                                  <span className="text-slate-600 font-medium">
                                    Vence: <strong>{new Date(item.dueDate).toLocaleDateString('es-NI', { dateStyle: 'medium' })}</strong>
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="font-black text-slate-900">
                                    C$ {item.expectedAmount.toFixed(2)}
                                  </span>
                                  {isItemPaid && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Pagado
                                    </span>
                                  )}
                                  {isItemOverdue && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
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

                    {/* Abonos History */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase text-slate-400 mb-2 tracking-wider flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Historial de Abonos Recibidos ({order.paymentsHistory?.length || 0}):</span>
                      </h4>

                      {(!order.paymentsHistory || order.paymentsHistory.length === 0) ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          Aún no se han registrado abonos para esta solicitud.
                        </p>
                      ) : (
                        <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200/80 max-h-48 overflow-y-auto">
                          {order.paymentsHistory.map(abono => (
                            <div key={abono.id} className="p-2.5 text-xs flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors">
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  + C$ {abono.amount.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {new Date(abono.date).toLocaleString('es-NI', { dateStyle: 'short', timeStyle: 'short' })}
                                  {abono.note && ` — ${abono.note}`}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="hidden sm:inline-block text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Abono Registrado
                                </span>
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

                {/* Footer Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 font-medium">
                    {isPagado
                      ? '🎉 La solicitud está completamente pagada.'
                      : `Falta abonar C$ ${remainingBalance.toFixed(2)} para saldar la deuda.`}
                  </div>

                  <button
                    onClick={() => handleOpenAbonoModal(order)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Registrar Abono / Cuota</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
