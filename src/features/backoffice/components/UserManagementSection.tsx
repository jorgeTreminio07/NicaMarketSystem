import React, { useState, useEffect } from 'react';
import { BackofficeUser } from '../../../types';
import { getUsers, createUser, deleteUser } from '../../../infrastructure/api/apiClient';
import { Users, UserPlus, Trash2, ShieldCheck, Mail, Lock, KeyRound, Loader2, CheckCircle2, AlertCircle, Code, Copy, Check } from 'lucide-react';

export const UserManagementSection: React.FC = () => {
  const [users, setUsers] = useState<BackofficeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showSqlScript, setShowSqlScript] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await getUsers();
      setUsers(list);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'El correo electrónico y la contraseña son requeridos.' });
      return;
    }

    if (password.trim().length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setIsCreating(true);
    setMessage(null);
    try {
      const newU = await createUser({
        email: email.trim(),
        password: password.trim(),
        role
      });
      setUsers(prev => [...prev, newU]);
      setEmail('');
      setPassword('');
      setRole('staff');
      setMessage({ type: 'success', text: `Usuario ${newU.email} creado exitosamente en la base de datos.` });
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error al crear usuario' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail.toLowerCase() === 'admin@admin.com') {
      alert('El usuario administrador principal no se puede eliminar.');
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario ${userEmail}?`)) return;

    try {
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: `Usuario ${userEmail} eliminado.` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar usuario');
    }
  };

  const supabaseSqlScript = `-- ==========================================
-- SCRIPT DE TABLAS EN SUPABASE PARA LA TIENDA
-- ==========================================

-- 1. Tabla de Usuarios con contraseña encriptada (hash)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Configuración de la Tienda
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT NOT NULL DEFAULT 'NicaMarket',
    description TEXT,
    logo_url TEXT,
    whatsapp_number TEXT NOT NULL DEFAULT '50589098184',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Productos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'General',
    stock INT NOT NULL DEFAULT 0,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 4. Tabla de Solicitudes y Cartera de Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pendiente',
    payment_type TEXT DEFAULT 'contado',
    installment_count INT DEFAULT 1,
    payment_schedule JSONB DEFAULT '[]'::jsonb,
    payments_history JSONB DEFAULT '[]'::jsonb,
    total_paid NUMERIC(10,2) DEFAULT 0,
    credit_status TEXT DEFAULT 'En Proceso',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 5. Usuario Administrador por Defecto (Password encriptado SHA-512)
INSERT INTO public.users (email, password_hash, role)
VALUES (
    'admin@admin.com',
    '8ca91cae7fe5eb9cfec4466b8d96b1297dbfa455110bb51ec7ca3b00e84b80a42ea2d67aa3cb1be58a8a3cefb29ae6ec1df1ef3f48aa6173d1f1f0a202ec97bb',
    'admin'
) ON CONFLICT (email) DO NOTHING;
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(supabaseSqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header card with script launcher */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Gestión de Usuarios del Backoffice</h2>
            <p className="text-xs text-slate-500">
              Crea nuevos usuarios administradores o asistentes con contraseña encriptada en la tabla <strong className="text-slate-800">users</strong> de Supabase.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSqlScript(!showSqlScript)}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-2 shrink-0"
        >
          <Code className="w-4 h-4 text-emerald-600" />
          <span>{showSqlScript ? 'Ocultar Script SQL' : 'Ver Script SQL Supabase'}</span>
        </button>
      </div>

      {/* SQL Script Viewer Panel */}
      {showSqlScript && (
        <div className="bg-slate-950 text-slate-200 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Code className="w-4 h-4" />
              <span>Script de Creación de Tablas en Supabase</span>
            </div>
            <button
              onClick={copySqlToClipboard}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? '¡Copiado!' : 'Copiar Script SQL'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-900 rounded-2xl text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800 max-h-72">
            {supabaseSqlScript}
          </pre>
          <p className="text-[11px] text-slate-400">
            * El servidor Node/Express ya ejecuta estas migraciones automáticamente en memoria y Supabase, pero puedes copiar y ejecutar este script en el Editor SQL de Supabase si deseas verificar o estructurar manualmente las tablas.
          </p>
        </div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create User Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Crear Nuevo Usuario</h3>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>Correo Electrónico *</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ejemplo@nombredelatienda.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Contraseña *</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rol de Usuario</span>
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'staff')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-800"
              >
                <option value="staff">Personal / Asistente (Staff)</option>
                <option value="admin">Administrador (Admin)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando usuario...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Guardar Usuario en Supabase</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Users Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span>Usuarios Registrados</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {users.length}
              </span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Encriptación SHA-512 Activa
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold">Cargando lista de usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No se encontraron usuarios registrados.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map(u => {
                const isAdmin = u.email.toLowerCase() === 'admin@admin.com' || u.role === 'admin';

                return (
                  <div key={u.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${isAdmin ? 'bg-slate-900 text-emerald-400' : 'bg-slate-100 text-slate-700'}`}>
                        {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Users className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{u.email}</span>
                          {isAdmin && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
                              Admin Principal
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Rol: <strong className="capitalize text-slate-600">{u.role}</strong> • Creado: {new Date(u.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    {!isAdmin && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
