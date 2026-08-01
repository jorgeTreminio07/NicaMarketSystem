import React, { useState, useMemo, useEffect, useRef } from "react";
import { Product, CartItem, StoreSettings } from "../../types";
import { ProductCard } from "./components/ProductCard";
import { CategoryFilter } from "./components/CategoryFilter";
import { SearchBar } from "./components/SearchBar";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { Package, Sparkles, RefreshCw, Loader2 } from "lucide-react";

interface StoreViewProps {
  products: Product[];
  isLoading: boolean;
  onRefresh: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  cartItems: CartItem[];
  storeSettings?: StoreSettings;
}

export const StoreView: React.FC<StoreViewProps> = ({
  products,
  isLoading,
  onRefresh,
  onAddToCart,
  cartItems,
  storeSettings,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Automatic Infinite Scroll state (Charge 10 by 10)
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Reset visibleCount on filter change
  useEffect(() => {
    setVisibleCount(10);
  }, [selectedCategory, searchQuery]);

  // Extract unique categories from product list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return cats.sort();
  }, [products]);

  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todas: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter and ensure Alphabetical order
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory !== "Todas") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    // Alphabetical order guarantee (A-Z)
    return result.sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );
  }, [products, selectedCategory, searchQuery]);

  // Paginated visible products
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Automatic Infinite Scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          visibleCount < filteredProducts.length
        ) {
          setVisibleCount((prev) => prev + 10);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length]);

  // Check if product is in cart
  const isProductInCart = (productId: string) => {
    return cartItems.some((item) => item.product.id === productId);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
      {/* Banner / Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-4 sm:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] sm:text-xs font-semibold border border-emerald-500/30">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            <span>Completo y Actualizado</span>
          </div>
          <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            ¡Te damos la bienvenida a nuestro catálogo!
          </h1>
          <p className="text-xs sm:text-base text-slate-300 leading-normal sm:leading-relaxed">
            {storeSettings?.description ||
              "Explora nuestra tienda en línea. Todos los productos están organizados alfabéticamente. Filtra por categoría, busca lo que deseas e ingresa tu pedido directo por WhatsApp."}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-teal-500 to-transparent pointer-events-none" />
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 shrink-0"
            title="Actualizar catálogo"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`}
            />
            <span>Refrescar</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
          />
        </div>
      </div>

      {/* Products Grid Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-slate-900">
            {selectedCategory === "Todas"
              ? "Todos los Productos"
              : selectedCategory}
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Ordenados alfabéticamente (A-Z)
        </span>
      </div>

      {/* Loading Skeleton or Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-2.5 sm:p-4 border border-slate-200 space-y-3 animate-pulse"
            >
              <div className="aspect-square w-full bg-slate-200 rounded-xl" />
              <div className="h-4 sm:h-5 bg-slate-200 rounded-md w-3/4" />
              <div className="h-3 sm:h-4 bg-slate-100 rounded-md w-full" />
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2">
                <div className="h-5 sm:h-6 bg-slate-200 rounded-md w-1/3" />
                <div className="h-7 sm:h-9 bg-slate-200 rounded-xl w-full sm:w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No se encontraron productos
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Intenta cambiar los términos de búsqueda o selecciona otra
            categoría.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("Todas");
              setSearchQuery("");
            }}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-md"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={setSelectedProduct}
                onAddToCart={(prod, e) => {
                  e.stopPropagation();
                  onAddToCart(prod, 1);
                }}
                isAdded={isProductInCart(product.id)}
              />
            ))}
          </div>

          {/* Sentinel element for infinite scroll */}
          {visibleCount < filteredProducts.length && (
            <div
              ref={loadMoreRef}
              className="py-6 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Cargando más productos automáticamente...</span>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(prod, qty) => onAddToCart(prod, qty)}
      />
    </div>
  );
};
