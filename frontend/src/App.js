import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import Landing from "@/components/Landing";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";
import AdminPanel from "@/components/AdminPanel";
import AdBlockDetector from "@/components/AdBlockDetector";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [isAdBlockEnabled, setIsAdBlockEnabled] = useState(false);
  const [config, setConfig] = useState({ credits_per_interval: 1, interval_seconds: 60 });

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchConfig();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API}/config`);
      setConfig(response.data);
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  const handleAuth = async (data, mode) => {
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const response = await axios.post(`${API}${endpoint}`, data);
      
      localStorage.setItem("token", response.data.access_token);
      setToken(response.data.access_token);
      setUser(response.data.user);
      setShowAuth(false);
      toast.success(mode === "login" ? "¡Inicio de sesión exitoso!" : "¡Registro exitoso!");
    } catch (error) {
      const message = error.response?.data?.detail || "Error en la autenticación";
      toast.error(message);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    toast.success("Sesión cerrada");
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  if (isAdBlockEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-4">AdBlock Detectado</h1>
          <p className="text-gray-300 mb-6">
            Por favor, desactiva tu bloqueador de anuncios para acceder a LSE Hosting.
            Necesitamos los anuncios para mantener el servicio gratuito.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <AdBlockDetector onAdBlockDetected={() => setIsAdBlockEnabled(true)} />
      <Toaster position="top-right" richColors />
      
      {!user ? (
        <>
          <Landing onGetStarted={() => setShowAuth(true)} />
          {showAuth && (
            <AuthModal
              mode={authMode}
              onClose={() => setShowAuth(false)}
              onAuth={handleAuth}
              onSwitchMode={(mode) => setAuthMode(mode)}
            />
          )}
        </>
      ) : user.is_admin ? (
        <AdminPanel
          user={user}
          onLogout={handleLogout}
          config={config}
          onConfigUpdate={setConfig}
        />
      ) : (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onUpdateUser={updateUser}
          config={config}
        />
      )}
    </div>
  );
}

export default App;