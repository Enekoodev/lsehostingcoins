import { useState, useEffect } from "react";
import { Users, Settings, LogOut, Plus, Minus, Coins } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminPanel({ user, onLogout, config, onConfigUpdate }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [reason, setReason] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [newConfig, setNewConfig] = useState(config);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount || !reason) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/admin/credits/add`,
        {
          usuario: selectedUser.usuario,
          credits: parseInt(creditAmount),
          reason: reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Créditos añadidos exitosamente");
      setCreditAmount("");
      setReason("");
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error adding credits:", error);
      toast.error("Error al añadir créditos");
    }
  };

  const handleRemoveCredits = async () => {
    if (!selectedUser || !creditAmount || !reason) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API}/admin/credits/remove`,
        {
          usuario: selectedUser.usuario,
          credits: parseInt(creditAmount),
          reason: reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Créditos removidos exitosamente");
      setCreditAmount("");
      setReason("");
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error removing credits:", error);
      toast.error("Error al remover créditos");
    }
  };

  const handleUpdateConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/admin/config`, newConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Configuración actualizada");
      onConfigUpdate(newConfig);
      setShowSettings(false);
    } catch (error) {
      console.error("Error updating config:", error);
      toast.error("Error al actualizar configuración");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Panel de Administración</h1>
                <p className="text-sm text-gray-400">LSE Hosting</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                data-testid="admin-settings-btn"
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Configuración
              </button>
              <button
                data-testid="admin-logout-btn"
                onClick={onLogout}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2 border border-red-600/30"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Settings Modal */}
          {showSettings && (
            <div className="glass rounded-2xl p-8 animate-slide-up" data-testid="admin-settings-panel">
              <h2 className="text-2xl font-bold text-white mb-6">Configuración del Sistema</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Créditos por Intervalo
                  </label>
                  <input
                    data-testid="config-credits-input"
                    type="number"
                    value={newConfig.credits_per_interval}
                    onChange={(e) => setNewConfig({ ...newConfig, credits_per_interval: parseInt(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Intervalo (segundos)
                  </label>
                  <input
                    data-testid="config-interval-input"
                    type="number"
                    value={newConfig.interval_seconds}
                    onChange={(e) => setNewConfig({ ...newConfig, interval_seconds: parseInt(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  data-testid="save-config-btn"
                  onClick={handleUpdateConfig}
                  className="btn-primary px-6 py-2"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Credit Management */}
          {selectedUser && (
            <div className="glass rounded-2xl p-8 animate-slide-up" data-testid="credit-management-panel">
              <h2 className="text-2xl font-bold text-white mb-6">
                Gestionar Créditos - {selectedUser.nombre}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cantidad de Créditos
                  </label>
                  <input
                    data-testid="credit-amount-input"
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Razón
                  </label>
                  <textarea
                    data-testid="credit-reason-input"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows="3"
                    placeholder="Bonificación especial..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    data-testid="add-credits-btn"
                    onClick={handleAddCredits}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Añadir Créditos
                  </button>
                  <button
                    data-testid="remove-credits-btn"
                    onClick={handleRemoveCredits}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Minus className="w-5 h-5" />
                    Remover Créditos
                  </button>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Usuarios Registrados</h2>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="users-table">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Nombre</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Usuario</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Email</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Créditos</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Admin</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-white">{u.nombre}</td>
                      <td className="py-3 px-4 text-gray-300">{u.usuario}</td>
                      <td className="py-3 px-4 text-gray-300">{u.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-blue-400 font-bold">
                          <Coins className="w-4 h-4" />
                          {u.credits}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.is_admin ? (
                          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">Admin</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs font-medium">Usuario</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          data-testid={`manage-user-${u.usuario}-btn`}
                          onClick={() => setSelectedUser(u)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}