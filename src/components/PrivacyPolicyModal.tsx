import React from 'react';
import { ShieldCheck, X, Lock, CheckCircle2, FileText } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Política de Privacidad
              </h2>
              <p className="text-xs text-slate-400">Nica Market — Protección y transparencia de tus datos</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm text-slate-300 leading-relaxed">
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-300 text-xs">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <p>
              En <strong>Nica Market</strong> valoramos y respetamos profundamente tu privacidad. Nos comprometemos a mantener una total transparencia respecto al manejo de tu información.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                1. Recopilación Mínima de Datos
              </h3>
              <p className="text-slate-400 text-xs pl-6">
                Únicamente recopilamos la información estrictamente necesaria para poder procesar y coordinar la entrega de tus pedidos:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-300 pl-8 space-y-1 mt-1">
                <li><strong>Nombre completo</strong> para identificar tu solicitud.</li>
                <li><strong>Número de teléfono</strong> para ponernos en contacto contigo vía WhatsApp.</li>
                <li><strong>Detalle de los productos solicitados</strong> y monto total del pedido.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                2. No Compartimos tu Información
              </h3>
              <p className="text-slate-400 text-xs pl-6">
                <strong>No vendemos, no alquilamos ni compartimos tus datos personales con terceros ni ninguna empresa externa bajo ninguna circunstancia.</strong> Tus datos permanecen 100% confidenciales dentro de nuestra plataforma.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                3. Uso Exclusivo del Canal WhatsApp
              </h3>
              <p className="text-slate-400 text-xs pl-6">
                El número de teléfono proporcionado se utiliza únicamente para coordinar la confirmación, facturación y estado de envío de la solicitud realizada. No realizamos spam ni comunicaciones no deseadas.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                4. Seguridad y Retención
              </h3>
              <p className="text-slate-400 text-xs pl-6">
                Tus solicitudes se almacenan de manera segura en nuestros servidores únicamente para fines de gestión de inventario y respaldo de facturación de compras. Puedes solicitar la eliminación de tu información en cualquier momento a través de nuestro canal oficial de soporte.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Última actualización: Julio 2026</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
