import React, { useState, useEffect, useCallback, FormEvent } from "react";
import {
  Product,
  Order,
  CartItem,
  PaymentType,
  StoreSettings,
  BackofficeUser,
} from "./types";
import {
  productRepository,
  orderRepository,
  getStoreSettings,
  loginUser,
} from "./infrastructure/api/apiClient";
import {
  GetProductsUseCase,
  AddProductUseCase,
  UpdateProductUseCase,
  UpdateStockUseCase,
} from "./domain/usecases/ProductUseCases";
import {
  GetOrdersUseCase,
  CreateOrderUseCase,
  ProcessOrderStatusUseCase,
  DeleteOrderUseCase,
} from "./domain/usecases/OrderUseCases";

import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { PrivacyPolicyModal } from "./components/PrivacyPolicyModal";
import {
  NotificationBanner,
  ToastMessage,
} from "./components/NotificationBanner";
import { StoreView } from "./features/store/StoreView";
import { CartView } from "./features/cart/CartView";
import { BackofficeView } from "./features/backoffice/BackofficeView";
import {
  Lock,
  ShieldCheck,
  X,
  CheckCircle2,
  Mail,
  Loader2,
} from "lucide-react";

// Instantiate Clean Architecture Use Cases
const getProductsUseCase = new GetProductsUseCase(productRepository);
const addProductUseCase = new AddProductUseCase(productRepository);
const updateProductUseCase = new UpdateProductUseCase(productRepository);
const updateStockUseCase = new UpdateStockUseCase(productRepository);

const getOrdersUseCase = new GetOrdersUseCase(orderRepository);
const createOrderUseCase = new CreateOrderUseCase(orderRepository);
const processOrderStatusUseCase = new ProcessOrderStatusUseCase(
  orderRepository,
);
const deleteOrderUseCase = new DeleteOrderUseCase(orderRepository);

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<BackofficeUser | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | undefined>(
    undefined,
  );

  const [activeTab, setActiveTab] = useState<"store" | "cart" | "backoffice">(
    () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get("admin") === "true" ||
        window.location.hash === "#backoffice"
      ) {
        return "backoffice";
      }
      return "store";
    },
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("ecom_cart_items");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return (
      urlParams.get("admin") === "true" ||
      window.location.hash === "#backoffice"
    );
  });
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);

  // Toast notification trigger
  const addToast = useCallback(
    (
      type: "success" | "error" | "info",
      title: string,
      description?: string,
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check DB connection health & load initial store settings
  useEffect(() => {
    fetch("/api/supabase-status")
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setSupabaseStatus({
            connected: true,
            message: "Base de datos conectada exitosamente",
          });
        } else {
          setSupabaseStatus({ connected: false, message: "Modo local activo" });
        }
      })
      .catch(() => {
        setSupabaseStatus({
          connected: false,
          message: "API responded in fallback mode",
        });
      });

    // Load store settings
    getStoreSettings()
      .then((settings) => {
        if (settings) setStoreSettings(settings);
      })
      .catch((err) =>
        console.error("Error cargando configuración de tienda:", err),
      );
  }, []);

  // Sync cart items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ecom_cart_items", JSON.stringify(cartItems));
    } catch (e) {
      console.error("Error guardando el carrito:", e);
    }
  }, [cartItems]);

  // Update browser tab title with the store name from settings
  useEffect(() => {
    const storeName =
      storeSettings?.name && storeSettings.name.trim()
        ? storeSettings.name
        : "NicaMarket";
    document.title = `${storeName} - Exclusivo para Clientes`;
  }, [storeSettings]);

  // Update browser tab favicon with the configured favicon photo
  useEffect(() => {
    const setFavicon = (href: string) => {
      const link: HTMLLinkElement | null = document.querySelector(
        'link[rel="icon"]',
      );
      const apple: HTMLLinkElement | null = document.querySelector(
        'link[rel="apple-touch-icon"]',
      );
      if (link) link.href = href;
      if (apple) apple.href = href;
    };

    if (storeSettings?.faviconUrl && storeSettings.faviconUrl.trim()) {
      setFavicon(storeSettings.faviconUrl.trim());
    } else {
      setFavicon("/favicon.svg");
    }
  }, [storeSettings]);

  // Load products and orders with support for silent background updates
  const refreshData = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const [prods, ords, settings] = await Promise.all([
          getProductsUseCase.execute(),
          getOrdersUseCase.execute(),
          getStoreSettings().catch(() => undefined),
        ]);
        setProducts(prods);
        setOrders(ords);
        if (settings) setStoreSettings(settings);
      } catch (err) {
        if (!silent) {
          console.error("Error cargando datos:", err);
          addToast(
            "error",
            "Error de conexión",
            "No se pudieron sincronizar los datos con el servidor.",
          );
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [addToast],
  );

  const loadData = useCallback(() => refreshData(false), [refreshData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Smart polling (every 15s) when tab is active for live stock & order status synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshData(true);
      }
    }, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshData(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshData]);

  // Real-time Cart Auto-Adjustment: Adjust customer cart quantities if stock changes on the server
  useEffect(() => {
    if (cartItems.length === 0 || products.length === 0) return;

    setCartItems((prevCart) => {
      let changed = false;
      const updatedCart = prevCart
        .map((item) => {
          const prod = products.find((p) => p.id === item.product.id);
          if (!prod) return item;
          if (prod.stock <= 0) {
            changed = true;
            return null; // Out of stock, remove from cart
          }
          if (item.quantity > prod.stock) {
            changed = true;
            return { ...item, quantity: prod.stock }; // Reduce quantity to available stock
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      return changed ? updatedCart : prevCart;
    });
  }, [products]);

  // Handle Admin Access Unlock via encrypted Supabase user verification
  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Ingrese usuario y contraseña.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");

    try {
      const user = await loginUser(loginEmail.trim(), loginPassword.trim());

      if (user) {
        setIsAdmin(true);
        setCurrentUser(user);
        setShowAdminModal(false);
        setActiveTab("backoffice");
        setLoginError("");
        addToast(
          "success",
          "Sesión Iniciada",
          `Bienvenido al Backoffice, ${user.email}`,
        );
      }
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : "Error al autenticar usuario.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleExitAdmin = () => {
    setIsAdmin(false);
    setCurrentUser(null);
    setActiveTab("store");
    addToast(
      "info",
      "Vista de Cliente Activada",
      "Has cerrado la sesión de administración.",
    );
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      addToast(
        "error",
        "Producto Agotado",
        `El producto ${product.name} no cuenta con stock disponible.`,
      );
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item,
        );
      } else {
        return [
          ...prev,
          { product, quantity: Math.min(product.stock, quantity) },
        ];
      }
    });

    addToast(
      "success",
      "¡Añadido al carrito!",
      `Se agregaron ${quantity} unidad(es) de ${product.name}`,
    );
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock;
          return { ...item, quantity: Math.min(maxStock, quantity) };
        }
        return item;
      }),
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.product.id !== productId),
    );
    addToast(
      "info",
      "Producto eliminado",
      "Se ha retirado el ítem de tu carrito.",
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Checkout Handler
  const handleCheckout = async (
    customerName: string,
    customerPhone: string,
    items: CartItem[],
    paymentType: PaymentType = "contado",
  ) => {
    try {
      const orderItems = items.map((i) => {
        const effectivePrice =
          i.product.discountPercent && i.product.discountPercent > 0
            ? i.product.price * (1 - i.product.discountPercent / 100)
            : i.product.price;

        return {
          productId: i.product.id,
          productName: i.product.name,
          price: effectivePrice,
          quantity: i.quantity,
          image: i.product.images?.[0],
        };
      });

      const createdOrder = await createOrderUseCase.execute(
        customerName,
        customerPhone,
        orderItems,
        paymentType,
      );

      addToast(
        "success",
        "¡Pedido registrado!",
        `Solicitud N° ${createdOrder.orderNumber || createdOrder.id} registrada en Backoffice.`,
      );

      // Refresh orders in background
      loadData();
      return createdOrder;
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "No se pudo registrar la solicitud.";
      addToast("error", "Error en el Checkout", errorMsg);
      return null;
    }
  };

  // Backoffice handlers
  const handleApproveOrder = async (
    orderId: string,
    paymentType?: PaymentType,
  ) => {
    try {
      const result = await processOrderStatusUseCase.execute(
        orderId,
        "Aprobado",
        paymentType,
      );
      addToast("success", "Solicitud Aprobada", result.message);

      // Reload fresh products and orders to reflect subtracted stock
      await loadData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al aprobar solicitud.";
      addToast("error", "Error", errorMsg);
    }
  };

  const handleUpdateOrderPaymentType = async (
    orderId: string,
    paymentType: PaymentType,
  ) => {
    try {
      const result = await processOrderStatusUseCase.execute(
        orderId,
        undefined,
        paymentType,
      );
      addToast(
        "success",
        "Modalidad de Pago Actualizada",
        "La modalidad de pago fue modificada correctamente.",
      );
      await loadData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Error al actualizar modalidad de pago.";
      addToast("error", "Error", errorMsg);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const result = await processOrderStatusUseCase.execute(
        orderId,
        "Rechazado",
      );
      addToast("info", "Solicitud Rechazada", result.message);
      await loadData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al rechazar solicitud.";
      addToast("error", "Error", errorMsg);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrderUseCase.execute(orderId);
      addToast(
        "info",
        "Solicitud eliminada",
        "La solicitud ha sido eliminada lógicamente.",
      );
      await loadData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al eliminar la solicitud.";
      addToast("error", "Error al eliminar", errorMsg);
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      await updateStockUseCase.execute(id, newStock);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)),
      );
      addToast(
        "success",
        "Stock actualizado",
        `Stock ajustado a ${newStock} unidades.`,
      );
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al actualizar el stock.";
      addToast("error", "Error de inventario", errorMsg);
    }
  };

  const handleUpdateProduct = async (
    id: string,
    updatedData: Partial<Product>,
  ) => {
    try {
      await updateProductUseCase.execute(id, updatedData);
      addToast(
        "success",
        "Producto actualizado",
        "Los datos del producto han sido guardados.",
      );
      await loadData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al actualizar producto.";
      addToast("error", "Error", errorMsg);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await productRepository.deleteProduct(id);
      addToast(
        "info",
        "Producto eliminado",
        "El producto ha sido retirado del catálogo.",
      );
      await loadData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al eliminar el producto.";
      addToast("error", "Error", errorMsg);
    }
  };

  const handleAddProduct = async (
    newProductData: Omit<Product, "id" | "createdAt">,
  ) => {
    try {
      const created = await addProductUseCase.execute(newProductData);
      addToast(
        "success",
        "Producto Creado",
        `El producto ${created.name} fue agregado y ordenado alfabéticamente.`,
      );
      await loadData();
      return created;
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al crear producto.";
      addToast("error", "Error", errorMsg);
      throw err;
    }
  };

  const totalCartCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const pendingOrdersCount = orders.filter(
    (o) => o.status === "Pendiente",
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab === "cart" ? "store" : activeTab}
        onSelectTab={(tab) => {
          if (tab === "backoffice" && !isAdmin) {
            setShowAdminModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
        cartCount={totalCartCount}
        pendingOrdersCount={pendingOrdersCount}
        onOpenCart={() => setActiveTab("cart")}
        isAdmin={isAdmin}
        onExitAdmin={handleExitAdmin}
        storeSettings={storeSettings}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === "store" && (
          <StoreView
            products={products}
            isLoading={isLoading}
            onRefresh={loadData}
            onAddToCart={handleAddToCart}
            cartItems={cartItems}
            storeSettings={storeSettings}
          />
        )}

        {activeTab === "cart" && (
          <CartView
            items={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            onGoBackToStore={() => setActiveTab("store")}
            storeWhatsappNumber={storeSettings?.whatsappNumber}
          />
        )}

        {activeTab === "backoffice" &&
          (!isAdmin ? (
            <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-100 shadow-xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Acceso Protegido al Backoffice
              </h2>
              <p className="text-xs text-slate-400">
                Se requiere iniciar sesión con usuario y contraseña registrados
                en Supabase.
              </p>
              <button
                onClick={() => setShowAdminModal(true)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all text-xs"
              >
                Iniciar Sesión en Backoffice
              </button>
            </div>
          ) : (
            <BackofficeView
              currentUser={currentUser}
              isAdmin={isAdmin}
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
              onStoreSettingsUpdated={(updated) => setStoreSettings(updated)}
            />
          ))}
      </main>

      {/* Footer */}
      {activeTab !== "backoffice" && (
        <Footer
          onOpenPrivacyPolicy={() => setShowPrivacyModal(true)}
          whatsappNumber={storeSettings?.whatsappNumber}
        />
      )}

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* Toast Notifications */}
      <NotificationBanner toasts={toasts} onDismiss={dismissToast} />

      {/* Admin Access Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  Acceso al Backoffice
                </h3>
                <p className="text-xs text-slate-400">
                  Autenticación de usuarios autorizados
                </p>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs font-bold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Usuario</span>
                </label>
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="usuario"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Contraseña</span>
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="contraseña"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all font-mono text-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Ingresar al Backoffice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
