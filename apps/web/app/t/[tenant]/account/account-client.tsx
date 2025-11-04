'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
}

export function AccountClient({ tenantSlug }: { tenantSlug: string }) {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
        setName(data.data.name || '');
        setPhone(data.data.phone || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: phone || null }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        setUser(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al actualizar el perfil' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Error al actualizar el nombre' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tu cuenta</p>
          <a
            href={`/t/${tenantSlug}/login`}
            className="inline-block bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Account Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Información Personal</h2>

          {message && (
            <div
              className={`mb-4 p-3 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 px-3 py-2 border cursor-not-allowed"
                placeholder="tu@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                El email no se puede modificar
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Actualizar Información'}
            </button>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
          <div className="space-y-3">
            <a
              href={`/t/${tenantSlug}/orders`}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mr-3">📦</div>
              <div>
                <div className="font-medium">Mis Pedidos</div>
                <div className="text-sm text-gray-500">
                  Ver historial de compras
                </div>
              </div>
            </a>

            <a
              href={`/t/${tenantSlug}/favorites`}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mr-3">❤️</div>
              <div>
                <div className="font-medium">Favoritos</div>
                <div className="text-sm text-gray-500">
                  Productos y servicios guardados
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Preferencias</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notificaciones por Email</div>
                <div className="text-sm text-gray-500">
                  Recibir actualizaciones de pedidos
                </div>
              </div>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notificaciones SMS</div>
                <div className="text-sm text-gray-500">
                  Recordatorios de citas
                </div>
              </div>
              <input type="checkbox" className="rounded" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Ofertas y Promociones</div>
                <div className="text-sm text-gray-500">
                  Recibir descuentos especiales
                </div>
              </div>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
          </div>
        </div>

        {/* Loyalty/Points */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Programa de Fidelidad
          </h2>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">
              1,250
            </div>
            <div className="text-gray-600">Puntos Acumulados</div>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 rounded-full h-2"
              style={{ width: '75%' }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>1,250 pts</span>
            <span>2,000 pts (Próximo nivel)</span>
          </div>
          <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
            Canjear Puntos
          </button>
        </div>
      </div>
    </>
  );
}
