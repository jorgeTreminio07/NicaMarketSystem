import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Product, Order, CartItem, PaymentType } from './types';
import { productRepository, orderRepository } from './infrastructure/api/apiClient';
import {
  GetProductsUseCase,
  AddProductUseCase,
  UpdateProductUseCase,
  UpdateStockUseCase,
} from './domain/usecases/ProductUseCases';
import {
  GetOrdersUseCase,
  CreateOrderUseCase,
  ProcessOrderStatusUseCase,
  DeleteOrderUseCase,
} from './domain/usecases/OrderUseCases';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { NotificationBanner, ToastMessage } from './components/NotificationBanner';
import { StoreView } from './features/store/StoreView';
import { CartView } from './features/cart/CartView';
import { BackofficeView } from './features/backoffice/BackofficeView';
import { Lock, ShieldCheck, X, CheckCircle2 } from 'lucide-react';

// Instantiate Clean Architecture Use Cases
const getProductsUseCase = new GetProductsUseCase(productRepository);
const addProductUseCase = new AddProductUseCase(productRepository);
const updateProductUseCase = new UpdateProductUseCase(productRepository);
const updateStockUseCase = new UpdateStockUseCase(productRepository);

const getOrdersUseCase = new GetOrdersUseCase(orderRepository);
const createOrderUseCase = new CreateOrderUseCase(orderRepository);
const processOrderStatusUseCase = new ProcessOrderStatusUseCase(orderRepository);
const deleteOrderUseCase = new DeleteOrderUseCase(orderRepository);

export default function App() {
  const ADMIN_PASSWORD = '850012cf-2945-4293-a2d5-6b2956d15cfb';

  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'store' | 'cart' | 'backoffice'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true' || window.location.hash === '#backoffice') {
      return 'backoffice';
    }
    return 'store';
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ecom_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('admin') === 'true' || window.location.hash === '#backoffice';
  });
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; message: string } | null>(null);

  // Toast notification trigger
  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Check Supabase connection health
  useEffect(() => {
    fetch('/api/supabase-status')
      .then(res => res.json())
      .then(data => {
        if (data.connected) {
          setSupabaseStatus({ connected: true, message: 'Supabase conectado exitosamente' });
        } else {
          setSupabaseStatus({ connected: false, message: 'Modo local activo' });
        }
      })
      .catch(() => {
        setSupabaseStatus({ connected: false, message: 'API responded in fallback mode' });
      });
  }, []);

  // Sync cart items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ecom_cart_items', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error guardando el carrito:', e);
    }
  }, [cartItems]);

  // Load products and orders
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, ords] = await Promise.all([
        getProductsUseCase.execute(),
        getOrdersUseCase.execute(),
      ]);
      setProducts(prods);
      setOrders(ords);
    } catch (err) {
      console.error('Error cargando datos:', err);
      addToast('error', 'Error de conexión', 'No se pudieron sincronizar los datos con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Admin Access Unlock
  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    const pin = adminPinInput.trim();
    if (pin === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminModal(false);
      setActiveTab('backoffice');
      setAdminPinInput('');
      setPinError('');
      addToast('success', 'Proyecto Backoffice Conectado', 'Acceso de administrador concedido.');
    } else {
      setPinError('Contraseña incorrecta. Ingrese la clave de administrador.');
    }
  };

  const handleExitAdmin = () => {
    setIsAdmin(false);
    setActiveTab('store');
    addToast('info', 'Vista de Cliente Activada', 'Has regresado a la Tienda pública.');
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      addToast('error', 'Producto Agotado', `El producto ${product.name} no cuenta con stock disponible.`);
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
      }
    });

    addToast('success', '¡Añadido al carrito!', `Se agregaron ${quantity} unidad(es) de ${product.name}`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }

    setCartItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock;
          return { ...item, quantity: Math.min(maxStock, quantity) };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
    addToast('info', 'Producto eliminado', 'Se ha retirado el ítem de tu carrito.');
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Checkout Handler
  const handleCheckout = async (customerName: string, customerPhone: string, items: CartItem[], paymentType: PaymentType = 'contado') => {
    try {
      const orderItems = items.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.images?.[0]
      }));

      const createdOrder = await createOrderUseCase.execute(customerName, customerPhone, orderItems, paymentType);

      addToast('success', '¡Pedido registrado!', `Solicitud N° ${createdOrder.orderNumber || createdOrder.id} registrada en Backoffice.`);

      // Refresh orders in background
      loadData();
      return createdOrder;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'No se pudo registrar la solicitud.';
      addToast('error', 'Error en el Checkout', errorMsg);
      return null;
    }
  };

  // Backoffice handlers
  const handleApproveOrder = async (orderId: string, paymentType?: PaymentType) => {
    try {
      const result = await processOrderStatusUseCase.execute(orderId, 'Aprobado', paymentType);
      addToast('success', 'Solicitud Aprobada', result.message);

      // Reload fresh products and orders to reflect subtracted stock
      await loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al aprobar solicitud.';
      addToast('error', 'Error', errorMsg);
    }
  };

  const handleUpdateOrderPaymentType = async (orderId: string, paymentType: PaymentType) => {
    try {
      const result = await processOrderStatusUseCase.execute(orderId, undefined, paymentType);
      addToast('success', 'Modalidad de Pago Actualizada', 'La modalidad de pago fue modificada correctamente.');
      await loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar modalidad de pago.';
      addToast('error', 'Error', errorMsg);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const result = await processOrderStatusUseCase.execute(orderId, 'Rechazado');
      addToast('info', 'Solicitud Rechazada', result.message);
      await loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al rechazar solicitud.';
      addToast('error', 'Error', errorMsg);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrderUseCase.execute(orderId);
      addToast('info', 'Solicitud eliminada', 'La solicitud ha sido eliminada lógicamente.');
      await loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar la solicitud.';
      addToast('error', 'Error al eliminar', errorMsg);
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      await updateStockUseCase.execute(id, newStock);
      setProducts(prev =>
        prev.map(p => (p.id === id ? { ...p, stock: newStock } : p))
      );
      addToast('success', 'Stock actualizado', `Stock ajustado a ${newStock} unidades.`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar el stock.';
      addToast('error', 'Error de inventario', errorMsg);
    }
  };

  const handleUpdateProduct = async (id: string, updatedData: Partial<Product>) => {
    try {
      await updateProductUseCase.execute(id, updatedData);
      addToast('success', 'Producto actualizado', 'Los datos del producto han sido guardados.');
      await loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar producto.';
      addToast('error', 'Error', errorMsg);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await productRepository.deleteProduct(id);
      addToast('info', 'Producto eliminado', 'El producto ha sido retirado del catálogo.');
      await loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar el producto.';
      addToast('error', 'Error', errorMsg);
    }
  };

  const handleAddProduct = async (newProductData: Omit<Product, 'id' | 'createdAt'>) => {
    try {
      const created = await addProductUseCase.execute(newProductData);
      addToast('success', 'Producto Creado', `El producto ${created.name} fue agregado y ordenado alfabéticamente.`);
      await loadData();
      return created;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear producto.';
      addToast('error', 'Error', errorMsg);
      throw err;
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'Pendiente').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab === 'cart' ? 'store' : activeTab}
        onSelectTab={tab => {
          if (tab === 'backoffice' && !isAdmin) {
            setShowAdminModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
        cartCount={totalCartCount}
        pendingOrdersCount={pendingOrdersCount}
        onOpenCart={() => setActiveTab('cart')}
        isAdmin={isAdmin}
        onExitAdmin={handleExitAdmin}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'store' && (
          <StoreView
            products={products}
            isLoading={isLoading}
            onRefresh={loadData}
            onAddToCart={handleAddToCart}
            cartItems={cartItems}
          />
        )}

        {activeTab === 'cart' && (
          <CartView
            items={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            onGoBackToStore={() => setActiveTab('store')}
          />
        )}

        {activeTab === 'backoffice' && (
          !isAdmin ? (
            <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-100 shadow-xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">Acceso Protegido al Backoffice</h2>
              <p className="text-sm text-slate-400">
                Se requiere contraseña de administrador para ingresar a la gestión del sistema.
              </p>
              <button
                onClick={() => setShowAdminModal(true)}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
              >
                Ingresar Contraseña de Administrador
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Supabase Status Banner inside Backoffice */}
              {supabaseStatus && (
                <div className="max-w-7xl mx-auto px-4 pt-4">
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    supabaseStatus.connected 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold">Estado de Base de Datos Supabase:</span>
                      <span>{supabaseStatus.message}</span>
                    </div>
                    <span className="font-mono text-[10px] opacity-80">https://xjiwhdnrxpsbbegqjicp.supabase.co</span>
                  </div>
                </div>
              )}

              <BackofficeView
                products={products}
                orders={orders}
                onApproveOrder={handleApproveOrder}
                onRejectOrder={handleRejectOrder}
                onDeleteOrder={handleDeleteOrder}
                onUpdateOrderPaymentType={handleUpdateOrderPaymentType}
                onUpdateStock={handleUpdateStock}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onAddProduct={handleAddProduct}
                onRefresh={loadData}
                isLoading={isLoading}
              />
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <Footer 
        onOpenPrivacyPolicy={() => setShowPrivacyModal(true)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />

      {/* Toast Notifications */}
      <NotificationBanner toasts={toasts} onDismiss={dismissToast} />

      {/* Admin Access Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Acceso Proyecto Backoffice</h3>
                <p className="text-xs text-slate-400">Panel de Administración de Inventarios y Solicitudes</p>
              </div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Clave de Administrador
                </label>
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={e => setAdminPinInput(e.target.value)}
                  placeholder="Ingrese su clave de acceso"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  El PIN es requerido para desbloquear la gestión de inventario y pedidos.
                </p>
                {pinError && <p className="text-xs text-rose-400 mt-1.5 font-medium">{pinError}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ingresar al Backoffice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

