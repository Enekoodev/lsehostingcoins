import { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import { Coins, Clock, History, ShoppingBag, LogOut, Server } from "lucide-react";

export default function Dashboard() {
  const { user, logout, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [creditHistory, setCreditHistory] = useState([]);
  const [nextEarnTime, setNextEarnTime] = useState(0);
  const [canEarn, setCanEarn] = useState(true);
  const [settings, setSettings] = useState({ credit_amount: 2, credit_interval: 300 });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchCreditHistory();
    fetchSettings();
  }, []);

  useEffect(() => {
    // Timer for auto earning
    const interval = setInterval(() => {
      if (canEarn && nextEarnTime > 0) {
        setNextEarnTime((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [canEarn, nextEarnTime]);

  const fetchSettings = async () => {
    // Solo fetch settings si el usuario es admin
    if (user?.role === "admin") {
      try {
        const response = await axios.get(`${API}/admin/settings`, { headers });
        setSettings(response.data);
      } catch (error) {
        setSettings({ credit_amount: 2, credit_interval: 300 });
      }
    } else {
      // Para usuarios normales, usa valores por defecto
      setSettings({ credit_amount: 2, credit_interval: 300 });
    }
  };

  const fetchCreditHistory = async () => {
    try {
      const response = await axios.get(`${API}/user/credit-history`, { headers });
      setCreditHistory(response.data);
    } catch (error) {
      console.error("Error fetching history", error);
    }
  };

  const earnCredits = async () => {
    try {
      const response = await axios.post(`${API}/user/earn-credits`, {}, { headers });
      if (response.data.success) {
        toast.success(response.data.message);
        setUser({ ...user, credits: response.data.credits });
        setNextEarnTime(response.data.next_earn_in);
        setCanEarn(false);
        fetchCreditHistory();
        setTimeout(() => setCanEarn(true), response.data.next_earn_in * 1000);
      } else {
        toast.warning(response.data.message);
        setNextEarnTime(response.data.remaining_seconds);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al ganar créditos");
      if (error.response?.data?.remaining_seconds) {
        setNextEarnTime(error.response.data.remaining_seconds);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">LSE Hosting</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-purple-600/30 px-4 py-2 rounded-full">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-bold" data-testid="user-credits">{user?.credits || 0}</span>
              </div>
              <span className="text-purple-200">Hola, {user?.nombre}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="logout-button"
                className="border-purple-500/50 text-white hover:bg-purple-600/50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Earn Credits */}
          <div className="lg:col-span-2 space-y-6">
            {/* Earn Credits Card */}
            <Card className="glass-effect border-purple-500/30 hover-lift" data-testid="earn-credits-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Coins className="w-6 h-6 text-yellow-400" />
                  <span>Ganar Créditos</span>
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Gana {settings.credit_amount} créditos cada {Math.floor(settings.credit_interval / 60)} minutos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="inline-block bg-gradient-to-br from-purple-500 to-indigo-600 p-8 rounded-2xl animate-glow">
                    <Coins className="w-16 h-16 text-white mx-auto" />
                  </div>
                  
                  {nextEarnTime > 0 ? (
                    <div>
                      <p className="text-purple-200 mb-2">Próximo crédito disponible en:</p>
                      <div className="text-4xl font-bold text-white flex items-center justify-center space-x-2">
                        <Clock className="w-8 h-8" />
                        <span data-testid="next-earn-timer">{formatTime(nextEarnTime)}</span>
                      </div>
                      <Progress value={(1 - nextEarnTime / settings.credit_interval) * 100} className="mt-4 h-2" />
                    </div>
                  ) : (
                    <Button
                      onClick={earnCredits}
                      data-testid="earn-credits-button"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-6 text-lg"
                    >
                      ¡Ganar {settings.credit_amount} Créditos Ahora!
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card
                className="glass-effect border-purple-500/30 hover-lift cursor-pointer"
                onClick={() => navigate("/shop")}
                data-testid="go-to-shop-card"
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <ShoppingBag className="w-5 h-5 text-purple-400" />
                    <span>Tienda</span>
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Canjea tus créditos por servidores
                  </CardDescription>
                </CardHeader>
              </Card>

              {user?.role === "admin" && (
                <Card
                  className="glass-effect border-purple-500/30 hover-lift cursor-pointer"
                  onClick={() => navigate("/admin")}
                  data-testid="go-to-admin-card"
                >
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Server className="w-5 h-5 text-purple-400" />
                      <span>Panel Admin</span>
                    </CardTitle>
                    <CardDescription className="text-purple-200">
                      Gestionar usuarios y configuración
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column - Credit History */}
          <div>
            <Card className="glass-effect border-purple-500/30" data-testid="credit-history-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <History className="w-5 h-5 text-purple-400" />
                  <span>Historial</span>
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Tus últimas transacciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {creditHistory.length === 0 ? (
                    <p className="text-purple-300 text-center py-8">No hay historial aún</p>
                  ) : (
                    creditHistory.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start p-3 bg-purple-900/30 rounded-lg border border-purple-500/20"
                        data-testid={`history-item-${index}`}
                      >
                        <div className="flex-1">
                          <p className="text-white text-sm">{item.reason}</p>
                          <p className="text-purple-300 text-xs">
                            {new Date(item.timestamp).toLocaleString('es-ES')}
                          </p>
                        </div>
                        <span
                          className={`font-bold ${
                            item.amount >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {item.amount >= 0 ? "+" : ""}{item.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
