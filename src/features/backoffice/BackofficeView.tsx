import React, { useState } from 'react';
import { Product, Order, PaymentType, StoreSettings, BackofficeUser } from '../../types';
import { OrdersSection } from './components/OrdersSection';
import { StockManagementSection } from './components/StockManagementSection';
import { AddProductSection } from './components/AddProductSection';
import { CreditManagementSection } from './components/CreditManagementSection';
import { ReportsSection } from './components/ReportsSection';
import { StoreSettingsSection } from './components/StoreSettingsSection';
import { UserManagementSection } from './components/UserManagementSection';
import { AdminAuthModal } from './components/AdminAuthModal';
import { Inbox, Layers, PlusCircle, ShieldCheck, RefreshCw, Database, CreditCard, BarChart3, Trash2, Sparkles, Loader2, Store, Users } from 'lucide-react';
import { seedDatabase, clearDatabase } from '../../infrastructure/api/apiClient';

interface BackofficeViewProps {
  currentUser?: BackofficeUser | null;
  isAdmin?: boolean;
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
  onStoreSettingsUpdated?: (settings: StoreSettings) => void;
}

export const BackofficeView: React.FC<BackofficeViewProps> = ({
  currentUser,
  isAdmin,
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
  onStoreSettingsUpdated,
}) => {
  const [subTab, setSubTab] = useState<'orders' | 'credits' | 'reports' | 'stock' | 'add' | 'settings' | 'users'>('orders');
  const [isOperatingDb, setIsOperatingDb] = useState(false);
  const [dbMessage, setDbMessage] = useState<string | null>(null);

  const isSystemAdmin = isAdmin || currentUser?.role === 'admin' || currentUser?.email.toLowerCase() === 'admin' || currentUser?.email.toLowerCase() === 'admin@admin.com';

  // Admin Auth Modal state
  const [adminAuthModal, setAdminAuthModal] = useState<{
    isOpen: boolean;
    actionType: 'seed' | 'clear' | null;
  }>({ isOpen: false, actionType: null });

  const pendingOrdersCount = orders.filter(o => o.status === 'Pendiente').length;
  const approvedOrdersCount = orders.filter(o => o.status === 'Aprobado').length;
  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  const handleOpenAuthModal = (type: 'seed' | 'clear') => {
    setAdminAuthModal({ isOpen: true, actionType: type });
  };

  const handleAdminAuthConfirm = async (credentials: { email: string; password: string }) => {
    setIsOperatingDb(true);
    setDbMessage(null);
    try {
      if (adminAuthModal.actionType === 'seed') {
        const res = await seedDatabase(credentials);
        setDbMessage(res.message || 'Base de datos poblada exitosamente por el administrador.');
      } else if (adminAuthModal.actionType === 'clear') {
        const res = await clearDatabase(credentials);
        setDbMessage(res.message || 'Base de datos vaciada por completo.');
      }
      onRefresh();
      setTimeout(() => setDbMessage(null), 4000);
    } finally {
      setIsOperatingDb(false);
    }
  };

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

        {/* Backend Database Status Badge & DB Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium flex items-center gap-2 text-slate-300 justify-center">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Sistema: <strong className="text-white">Base de Datos Activa</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {isSystemAdmin && (
              <>
                <button
                  onClick={() => handleOpenAuthModal('seed')}
                  disabled={isLoading || isOperatingDb}
                  className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                  title="Poblar base de datos con datos de prueba"
                >
                  {isOperatingDb ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Poblar Datos</span>
                </button>

                <button
                  onClick={() => handleOpenAuthModal('clear')}
                  disabled={isLoading || isOperatingDb}
                  className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95"
                  title="Vaciar toda la información de la base de datos"
                >
                  {isOperatingDb ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Vaciar DB</span>
                </button>
              </>
            )}

            <button
              onClick={onRefresh}
              disabled={isLoading || isOperatingDb}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition-all active:scale-95"
              title="Refrescar datos del Backoffice"
            >
              <RefreshCw className={`w-4 h-4 ${(isLoading || isOperatingDb) ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {dbMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{dbMessage}</span>
          <button onClick={() => setDbMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-black">
            ✕
          </button>
        </div>
      )}

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

        <button
          onClick={() => setSubTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            subTab === 'settings'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Store className="w-4 h-4 text-emerald-400" />
          <span>Datos de la Tienda</span>
        </button>

        {isSystemAdmin && (
          <button
            onClick={() => setSubTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              subTab === 'users'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Usuarios</span>
          </button>
        )}
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

      {subTab === 'settings' && (
        <StoreSettingsSection
          onSettingsUpdated={onStoreSettingsUpdated}
        />
      )}

      {subTab === 'users' && isSystemAdmin && (
        <UserManagementSection />
      )}


      {/* Admin Credentials Auth Modal */}
      <AdminAuthModal
        isOpen={adminAuthModal.isOpen}
        title={adminAuthModal.actionType === 'seed' ? 'Poblar Base de Datos' : 'Vaciar Base de Datos'}
        description={
          adminAuthModal.actionType === 'seed'
            ? 'Ingrese usuario y contraseña de administrador para confirmar el restablecimiento e inserción de datos iniciales.'
            : 'Ingrese usuario y contraseña de administrador para confirmar la eliminación completa de toda la información de la base de datos.'
        }
        confirmButtonText={adminAuthModal.actionType === 'seed' ? 'Confirmar y Poblar DB' : 'Confirmar y Vaciar DB'}
        isDanger={adminAuthModal.actionType === 'clear'}
        onClose={() => setAdminAuthModal({ isOpen: false, actionType: null })}
        onConfirm={handleAdminAuthConfirm}
      />
    </div>
  );
};
