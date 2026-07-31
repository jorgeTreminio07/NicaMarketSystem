import React, { useState } from 'react';
import { Product, Order, PaymentType } from '../../types';
import { OrdersSection } from './components/OrdersSection';
import { StockManagementSection } from './components/StockManagementSection';
import { AddProductSection } from './components/AddProductSection';
import { CreditManagementSection } from './components/CreditManagementSection';
import { ReportsSection } from './components/ReportsSection';
import { Inbox, Layers, PlusCircle, ShieldCheck, RefreshCw, Database, CreditCard, BarChart3 } from 'lucide-react';
import { isSupabaseConfigured } from '../../infrastructure/supabase/supabaseClient';

interface BackofficeViewProps {
  products: Product[];
  orders: Order[];
  onApproveOrder: (orderId: string, paymentType?: PaymentType) => Promise<void>;
  onRejectOrder: (orderId: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onUpdateOrderPaymentType?: (orderId: string, paymentType: PaymentType) => Promise<void>;
  onUpdateStock: (id: string, newStock: number) => Promise<void>;
  onUpdateProduct: (id: string, updatedData: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAddProduct: (newProductData: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
  onRefresh: () => void;
  isLoading: boolean;
}

export const BackofficeView: React.FC<BackofficeViewProps> = ({
  products,
  orders,
  onApproveOrder,
  onRejectOrder,
  onDeleteOrder,
  onUpdateOrderPaymentType,
  onUpdateStock,
  onUpdateProduct,
  onDeleteProduct,
  onAddProduct,
  onRefresh,
  isLoading,
}) => {
  const [subTab, setSubTab] = useState<'orders' | 'credits' | 'reports' | 'stock' | 'add'>('orders');

  const pendingOrdersCount = orders.filter(o => o.status === 'Pendiente').length;
  const approvedOrdersCount = orders.filter(o => o.status === 'Aprobado').length;
  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Panel Administrativo Backoffice</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gestión de Tienda, Pedidos & Cartera
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Revisa las solicitudes de compra enviadas por los clientes, aprueba o rechaza pedidos, gestiona la cartera de cuotas y abonos, y administra el inventario.
          </p>
        </div>

        {/* Backend Database Status Badge & Refresh */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>
              Backend: <strong className="text-white">{isSupabaseConfigured ? 'Supabase DB' : 'Express REST Engine'}</strong>
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-all active:scale-95"
            title="Refrescar datos del Backoffice"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            subTab === 'orders'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4 text-emerald-400" />
          <span>Solicitudes de Pedidos</span>
          {pendingOrdersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
              {pendingOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('credits')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            subTab === 'credits'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span>Cartera y Abonos</span>
          {approvedOrdersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
              {approvedOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            subTab === 'reports'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Reportes y Estadísticas</span>
        </button>

        <button
          onClick={() => setSubTab('stock')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            subTab === 'stock'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Ver Stock e Inventario</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-800">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('add')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            subTab === 'add'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Sub-Tab Content */}
      {subTab === 'orders' && (
        <OrdersSection
          orders={orders}
          onApproveOrder={onApproveOrder}
          onRejectOrder={onRejectOrder}
          onDeleteOrder={onDeleteOrder}
          onUpdatePaymentType={onUpdateOrderPaymentType}
          isLoading={isLoading}
        />
      )}

      {subTab === 'credits' && (
        <CreditManagementSection
          orders={orders}
          onRefresh={onRefresh}
          isLoading={isLoading}
        />
      )}

      {subTab === 'reports' && (
        <ReportsSection
          orders={orders}
          products={products}
        />
      )}

      {subTab === 'stock' && (
        <StockManagementSection
          products={products}
          onUpdateStock={onUpdateStock}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
          isLoading={isLoading}
        />
      )}

      {subTab === 'add' && (
        <AddProductSection
          onAddProduct={onAddProduct}
          existingCategories={categories}
        />
      )}
    </div>
  );
};
