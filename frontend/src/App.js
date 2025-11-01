import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Shop from "./pages/Shop";
import AdminPanel from "./pages/AdminPanel";
import { Toaster } from "./components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = React.createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adblockDetected, setAdblockDetected] = useState(false);

  // Check for adblock
  useEffect(() => {
    const detectAdblock = async () => {
      try {
        // Try to fetch a fake ad URL
        const response = await fetch(
          "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",
          {
            method: "HEAD",
            mode: "no-cors",
          }
        );
        setAdblockDetected(false);
      } catch (e) {
        setAdblockDetected(true);
      }
    };

    // Alternative detection method
    const bait = document.createElement("div");
    bait.className = "ad ads adsbox adslot ad-placement ad-unit";
    bait.style.cssText = "height:1px;width:1px;position:absolute;top:-9999px;";
    document.body.appendChild(bait);

    setTimeout(() => {
      if (bait.offsetHeight === 0) {
        setAdblockDetected(true);
      }
      document.body.removeChild(bait);
    }, 100);

    detectAdblock();
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const response = await axios.post(`${API}/auth/login`, {
      username,
      password,
    });
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (userData) => {
    const response = await axios.post(`${API}/auth/register`, userData);
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="text-white text-2xl">Cargando...</div>
      </div>
    );
  }

  // Show adblock warning if detected
  if (adblockDetected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md text-center border border-white/20">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            AdBlock Detectado
          </h1>
          <p className="text-white/80 mb-6">
            Por favor, desactiva tu bloqueador de anuncios para acceder a LSE
            Hosting. Necesitamos mostrar anuncios para mantener el servicio
            gratuito.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            data-testid="reload-button"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setUser }}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} />
                ) : (
                  <LandingPage />
                )
              }
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Navigate to="/" />}
            />
            <Route
              path="/shop"
              element={user ? <Shop /> : <Navigate to="/" />}
            />
            <Route
              path="/admin"
              element={
                user && user.role === "admin" ? (
                  <AdminPanel />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </div>
    </AuthContext.Provider>
  );
}

export default App;

export { API };
import React from "react";
