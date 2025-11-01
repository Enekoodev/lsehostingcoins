import { useState } from "react";
import { X, Mail, Lock, User, UserCircle } from "lucide-react";

export default function AuthModal({ mode, onClose, onAuth, onSwitchMode }) {
  const [formData, setFormData] = useState({
    nombre: "",
    usuario: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await onAuth({
          usuario: formData.usuario,
          password: formData.password
        }, mode);
      } else {
        await onAuth(formData, mode);
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="auth-modal">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-800 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white">
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </h2>
          <button
            data-testid="close-auth-modal-btn"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  data-testid="register-nombre-input"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-10 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                data-testid="auth-usuario-input"
                type="text"
                value={formData.usuario}
                onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-10 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="juanperez"
                required
              />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  data-testid="register-email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-10 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="juan@ejemplo.com"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                data-testid="auth-password-input"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-10 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            data-testid="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Procesando..." : mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </button>
        </form>

        {/* Switch mode */}
        <div className="p-6 border-t border-slate-800 text-center">
          <p className="text-gray-400">
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
            {" "}
            <button
              data-testid="switch-auth-mode-btn"
              onClick={() => onSwitchMode(mode === "login" ? "register" : "login")}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}