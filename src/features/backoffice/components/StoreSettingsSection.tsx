import React, { useState, useEffect } from 'react';
import { BankAccount, StoreSettings } from '../../../types';
import { getStoreSettings, updateStoreSettings } from '../../../infrastructure/api/apiClient';
import { Store, Image as ImageIcon, Upload, Phone, FileText, Save, Loader2, CheckCircle2, AlertCircle, Landmark, Plus, Trash2, Pencil, X } from 'lucide-react';
import { uploadStoreLogo, uploadStoreFavicon } from '../../../infrastructure/supabase/uploadImage';

const CURRENCY_OPTIONS = ['C$', 'USD', 'Billetera Móvil', 'Otra'];

const newBankAccount = (): BankAccount => ({
  id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()),
  bankName: '',
  currency: 'C$',
  accountNumber: '',
  holder: '',
});

interface StoreSettingsSectionProps {
  onSettingsUpdated?: (settings: StoreSettings) => void;
}

export const StoreSettingsSection: React.FC<StoreSettingsSectionProps> = ({ onSettingsUpdated }) => {
  const [settings, setSettings] = useState<StoreSettings>({
    name: 'NicaMarket',
    description: 'Explora nuestra tienda en línea. Todos los productos están organizados alfabéticamente.',
    logoUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    whatsappNumber: '50589098184'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [uploadFaviconStatus, setUploadFaviconStatus] = useState<string | null>(null);
  const [uploadFaviconError, setUploadFaviconError] = useState<string | null>(null);
  const [bankModal, setBankModal] = useState<{ isOpen: boolean; draft: BankAccount; editingId?: string }>({
    isOpen: false,
    draft: newBankAccount(),
  });
  const [isSavingBank, setIsSavingBank] = useState(false);

  const openAddBankAccount = () => {
    setBankModal({ isOpen: true, draft: newBankAccount() });
  };

  const openEditBankAccount = (acc: BankAccount) => {
    setBankModal({ isOpen: true, draft: { ...acc }, editingId: acc.id });
  };

  const persistBankAccounts = async (nextBankAccounts: BankAccount[]) => {
    setIsSavingBank(true);
    setMessage(null);
    try {
      const updated = await updateStoreSettings({ ...settings, bankAccounts: nextBankAccounts });
      setSettings(updated);
      if (onSettingsUpdated) onSettingsUpdated(updated);
      setMessage({ type: 'success', text: 'Cuenta Registrada Correctamente.' });
      setTimeout(() => setMessage(null), 3000);
      return true;
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar la cuenta',
      });
      return false;
    } finally {
      setIsSavingBank(false);
    }
  };

  const saveBankAccount = async () => {
    const bankAccounts = settings.bankAccounts || [];
    let nextBankAccounts: BankAccount[];
    if (bankModal.editingId) {
      nextBankAccounts = bankAccounts.map((a) =>
        a.id === bankModal.editingId ? { ...bankModal.draft } : a,
      );
    } else {
      nextBankAccounts = [...bankAccounts, { ...bankModal.draft }];
    }
    const ok = await persistBankAccounts(nextBankAccounts);
    if (ok) {
      setBankModal({ isOpen: false, draft: newBankAccount() });
    }
  };

  const removeBankAccount = async (id: string) => {
    const nextBankAccounts = (settings.bankAccounts || []).filter((a) => a.id !== id);
    await persistBankAccounts(nextBankAccounts);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getStoreSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error cargando configuración:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const publicUrl = await uploadStoreLogo({
        file,
        onStatus: (status) => setUploadStatus(status),
      });
      setSettings((prev) => ({ ...prev, logoUrl: publicUrl }));
      setMessage({ type: 'success', text: '¡Logo subido correctamente! Guarda los cambios para aplicarlo.' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setUploadError(err?.message || 'No se pudo subir el logo.');
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploadingFavicon(true);
    setUploadFaviconError(null);
    try {
      const publicUrl = await uploadStoreFavicon({
        file,
        onStatus: (status) => setUploadFaviconStatus(status),
      });
      setSettings((prev) => ({ ...prev, faviconUrl: publicUrl }));
      setMessage({ type: 'success', text: '¡Favicon subido correctamente! Guarda los cambios para aplicarlo.' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setUploadFaviconError(err?.message || 'No se pudo subir el favicon.');
    } finally {
      setIsUploadingFavicon(false);
      setUploadFaviconStatus(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.name.trim() || !settings.whatsappNumber.trim()) {
      setMessage({ type: 'error', text: 'El nombre de la tienda y el número de WhatsApp son obligatorios.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await updateStoreSettings(settings);
      setSettings(updated);
      if (onSettingsUpdated) onSettingsUpdated(updated);
      setMessage({ type: 'success', text: '¡Configuración de la tienda actualizada correctamente en la base de datos!' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error al guardar cambios' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-bold text-slate-600">Cargando configuración de la tienda...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Configuración de la Tienda</h2>
          <p className="text-xs text-slate-500">
            Administra el nombre, la descripción, el logo y el número de WhatsApp receptor de solicitudes.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preview Banner / Header Card */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center gap-4 border border-slate-800">
          <img
            src={settings.logoUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
            alt="Logo Preview"
            className="w-14 h-14 rounded-xl object-cover border border-slate-700 bg-slate-800 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Previsualización del Encabezado</span>
            <h3 className="text-base font-extrabold truncate">{settings.name || 'Nombre de la Tienda'}</h3>
            <p className="text-xs text-slate-400 truncate">{settings.description || 'Descripción de la tienda...'}</p>
            <p className="text-[11px] text-emerald-400 font-medium mt-1">
              WhatsApp Recepción: +{settings.whatsappNumber || '50589098184'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Store Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nombre de la Tienda *</span>
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={e => setSettings({ ...settings, name: e.target.value })}
              placeholder="Ej. Comercial Mi Tienda"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              required
            />
          </div>

          {/* WhatsApp Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Número de WhatsApp Receptora de Solicitudes *</span>
            </label>
            <input
              type="text"
              value={settings.whatsappNumber}
              onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
              placeholder="Ej. 50589098184 o 89098184"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              required
            />
            <p className="text-[11px] text-slate-400">
              Número donde los clientes enviarán sus pedidos al hacer clic en Comprar.
            </p>
          </div>

          {/* Logo URL */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>URL del Logo / Imagen de la Tienda</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={settings.logoUrl}
                onChange={e => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="https://..."
                className="flex-1 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload className="w-4 h-4" />
                <span>{isUploading ? (uploadStatus || "Subiendo...") : "Subir foto"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
            {isUploading && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span className="text-xs text-slate-500">{uploadStatus || "Procesando..."}</span>
              </div>
            )}
            {uploadError && (
              <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                {uploadError}
              </p>
            )}
          </div>

          {/* Favicon URL */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Icono de pestaña</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={settings.faviconUrl || ''}
                onChange={e => setSettings({ ...settings, faviconUrl: e.target.value })}
                placeholder="https://... (opcional)"
                className="flex-1 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              />
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload className="w-4 h-4" />
                <span>{isUploadingFavicon ? (uploadFaviconStatus || "Subiendo...") : "Subir foto"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                  disabled={isUploadingFavicon}
                  className="hidden"
                />
              </label>
            </div>
            {isUploadingFavicon && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span className="text-xs text-slate-500">{uploadFaviconStatus || "Procesando..."}</span>
              </div>
            )}
            {uploadFaviconError && (
              <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                {uploadFaviconError}
              </p>
            )}
          </div>

          {/* Store Description */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Descripción de la Tienda</span>
            </label>
            <textarea
              rows={3}
              value={settings.description}
              onChange={e => setSettings({ ...settings, description: e.target.value })}
              placeholder="Escriba un breve texto descriptivo sobre su catálogo y modalidad de ventas..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium resize-none"
            />
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Datos Bancarios</h3>
            </div>
            <button
              type="button"
              onClick={openAddBankAccount}
              className="px-3 py-2 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar cuenta</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Estas cuentas aparecerán en los mensajes de aprobación y recordatorios de pago por WhatsApp. Haz clic en "Agregar cuenta" para registrarla.
          </p>

          {(settings.bankAccounts || []).length === 0 ? (
            <p className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl p-4 text-center">
              No hay cuentas configuradas. Los mensajes omitirán la sección de transferencia bancaria.
            </p>
          ) : (
            <div className="space-y-2">
              {settings.bankAccounts!.map((acc) => (
                <div
                  key={acc.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {acc.bankName || 'Banco'} {acc.currency ? `(${acc.currency})` : ''}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {acc.accountNumber || 'Sin número'}
                      {acc.holder ? ` · ${acc.holder}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditBankAccount(acc)}
                      title="Editar cuenta"
                      className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBankAccount(acc.id)}
                      title="Eliminar cuenta"
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Bank Account Modal */}
      {bankModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setBankModal({ isOpen: false, draft: newBankAccount() })}
          />
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                {bankModal.editingId ? 'Editar cuenta' : 'Agregar cuenta'}
              </h3>
              <button
                type="button"
                onClick={() => setBankModal({ isOpen: false, draft: newBankAccount() })}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  <span>Banco</span>
                </label>
                <input
                  type="text"
                  value={bankModal.draft.bankName}
                  onChange={e => setBankModal({ ...bankModal, draft: { ...bankModal.draft, bankName: e.target.value } })}
                  placeholder="Ej. Lafise"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    <span>Moneda</span>
                  </label>
                  <select
                    value={bankModal.draft.currency}
                    onChange={e => setBankModal({ ...bankModal, draft: { ...bankModal.draft, currency: e.target.value } })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  >
                    {CURRENCY_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-700">
                    <span>Número de cuenta</span>
                  </label>
                  <input
                    type="text"
                    value={bankModal.draft.accountNumber}
                    onChange={e => setBankModal({ ...bankModal, draft: { ...bankModal.draft, accountNumber: e.target.value } })}
                    placeholder="Ej. 123456789"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  <span>Titular</span>
                </label>
                <input
                  type="text"
                  value={bankModal.draft.holder}
                  onChange={e => setBankModal({ ...bankModal, draft: { ...bankModal.draft, holder: e.target.value } })}
                  placeholder="Nombre del titular"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBankModal({ isOpen: false, draft: newBankAccount() })}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveBankAccount}
                disabled={isSavingBank}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                {isSavingBank ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
