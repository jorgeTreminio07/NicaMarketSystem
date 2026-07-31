import React, { useState, useEffect } from 'react';
import { BackofficeUser } from '../../../types';
import { getUsers, createUser, updateUser, deleteUser } from '../../../infrastructure/api/apiClient';
import { Users, UserPlus, Trash2, ShieldCheck, Mail, Lock, KeyRound, Loader2, CheckCircle2, AlertCircle, Pencil, X, Save } from 'lucide-react';

export const UserManagementSection: React.FC = () => {
  const [users, setUsers] = useState<BackofficeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State for Create
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for Edit Modal
  const [editingUser, setEditingUser] = useState<BackofficeUser | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'staff'>('staff');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
      setMessage({ type: 'error', text: 'El usuario/correo y la contraseña son requeridos.' });
      return;
    }

    if (password.trim().length < 4) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 4 caracteres.' });
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

  const handleOpenEdit = (user: BackofficeUser) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditPassword('');
    setEditRole(user.role === 'admin' ? 'admin' : 'staff');
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setEditEmail('');
    setEditPassword('');
    setEditRole('staff');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editEmail.trim()) {
      setMessage({ type: 'error', text: 'El nombre de usuario/correo es obligatorio.' });
      return;
    }

    setIsSavingEdit(true);
    try {
      const updated = await updateUser(editingUser.id, {
        email: editEmail.trim(),
        password: editPassword.trim() || undefined,
        role: editRole
      });

      setUsers(prev => prev.map(u => u.id === editingUser.id ? updated : u));
      setMessage({ type: 'success', text: `Usuario ${updated.email} actualizado exitosamente.` });
      handleCloseEdit();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail.toLowerCase() === 'admin@admin.com' || userEmail.toLowerCase() === 'admin') {
      alert('El usuario administrador principal es intocable y no se puede eliminar.');
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Gestión de Usuarios del Backoffice</h2>
            <p className="text-xs text-slate-500">
              Administra los accesos del sistema. Crea, edita o elimina usuarios del sistema.
            </p>
          </div>
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
                <span>Usuario / Correo Electrónico *</span>
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ej. asistente o usuario@tienda.com"
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
                  <span>Guardar Usuario</span>
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
                const isPrimaryAdmin = u.email.toLowerCase() === 'admin@admin.com' || u.email.toLowerCase() === 'admin';

                return (
                  <div key={u.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${isPrimaryAdmin ? 'bg-slate-900 text-emerald-400' : 'bg-slate-100 text-slate-700'}`}>
                        {isPrimaryAdmin ? <ShieldCheck className="w-5 h-5" /> : <Users className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{u.email}</span>
                          {isPrimaryAdmin && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
                              Admin Principal (Intocable)
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Rol: <strong className="capitalize text-slate-600">{u.role}</strong> • Creado: {new Date(u.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    {!isPrimaryAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-2 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                          title="Editar usuario"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 text-slate-900 shadow-2xl relative space-y-5">
            <button
              onClick={handleCloseEdit}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Editar Usuario</h3>
                <p className="text-xs text-slate-500">Actualiza las credenciales y rol del usuario</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Usuario / Correo Electrónico *</span>
                </label>
                <input
                  type="text"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nueva Contraseña (Opcional)</span>
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Dejar en blanco para no cambiar"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Si no deseas modificar la contraseña actual, déjala vacía.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rol de Usuario</span>
                </label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as 'admin' | 'staff')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-800"
                >
                  <option value="staff">Personal / Asistente (Staff)</option>
                  <option value="admin">Administrador (Admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios</span>
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
};
