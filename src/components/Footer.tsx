import React from 'react';
import { ShoppingBag, ShieldCheck, PhoneCall, FileText } from 'lucide-react';

interface FooterProps {
  onOpenPrivacyPolicy?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacyPolicy }) => {
  return (
    <footer className="mt-16 bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white">Nica Market</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-300">
            <a 
              href="https://wa.me/50589098184" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Soporte WhatsApp</span>
            </a>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compras 100% Garantizadas</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Nica Market. Todos los derechos reservados.</p>
          
          <div className="flex items-center gap-4">
            {onOpenPrivacyPolicy && (
              <button
                onClick={onOpenPrivacyPolicy}
                className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors py-0.5 px-2 rounded hover:bg-slate-800"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Política de Privacidad</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};


