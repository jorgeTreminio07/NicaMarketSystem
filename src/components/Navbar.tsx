import React from "react";
import {
  ShoppingBag,
  ShoppingCart,
  Store,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { StoreSettings } from "../types";

interface NavbarProps {
  activeTab: "store" | "backoffice";
  onSelectTab: (tab: "store" | "backoffice") => void;
  cartCount: number;
  pendingOrdersCount: number;
  onOpenCart: () => void;
  isAdmin: boolean;
  onExitAdmin?: () => void;
  storeSettings?: StoreSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  cartCount,
  onOpenCart,
  isAdmin,
  onExitAdmin,
  storeSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      {/* Admin Mode Top Indicator Banner */}
      {isAdmin && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-300 px-4 py-1.5 text-xs flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">
              Modo Backoffice
            </span>
          </div>
          <button
            onClick={() => {
              if (onExitAdmin) onExitAdmin();
              onSelectTab("store");
            }}
            className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-2.5 py-0.5 rounded-md transition-colors text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Tienda Cliente</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onSelectTab("store")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform overflow-hidden">
            {storeSettings?.logoUrl ? (
              <img
                src={storeSettings.logoUrl}
                alt={storeSettings.name || "Logo"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <ShoppingBag className="w-5 h-5 text-slate-950" />
            )}
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {storeSettings?.name || "NicaMarket"}
            </span>
            <span className="hidden sm:inline-block text-xs text-emerald-400 ml-2 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {activeTab === "backoffice"
                ? "Backoffice Admin"
                : "Tienda Online"}
            </span>
          </div>
        </div>

        {/* View Switcher only if Admin Mode is active or toggled */}
        <div className="flex items-center gap-3">
          {activeTab === "store" && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exclusivo para Clientes</span>
            </div>
          )}

          {/* Cart Button (Only in Store View) */}
          {activeTab !== "backoffice" && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 transition-all active:scale-95 shadow-sm"
              title="Ver carrito de compras"
            >
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span className="hidden sm:inline text-xs font-semibold">
                Carrito
              </span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-slate-950 bg-emerald-400 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
