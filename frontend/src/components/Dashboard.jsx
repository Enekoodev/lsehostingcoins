import { useState, useEffect, useRef } from "react";
import { Coins, LogOut, Bell, Clock, TrendingUp } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard({ user, onLogout, onUpdateUser, config }) {
  const [credits, setCredits] = useState(user.credits);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const intervalRef = useRef(null);
  const lastClaimRef = useRef(0);

  useEffect(() => {
    // Page Visibility API
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
      if (document.hidden) {
        // Page hidden - claim credits if any
        if (earnedCredits > 0) {
          claimCredits();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [earnedCredits]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (isPageVisible) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          const intervals = Math.floor(newTime / config.interval_seconds);
          
          if (intervals > lastClaimRef.current) {
            const newIntervals = intervals - lastClaimRef.current;
            const newCredits = newIntervals * config.credits_per_interval;
            setEarnedCredits(prev => prev + newCredits);
            lastClaimRef.current = intervals;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPageVisible, config]);

  const claimCredits = async () => {
    if (earnedCredits === 0) return;

    try {
      const token = localStorage.getItem("token");
      const intervals = earnedCredits / config.credits_per_interval;
      const response = await axios.post(
        `${API}/credits/claim`,
        { intervals: intervals },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCredits(response.data.total_credits);
      toast.success(`¡+${earnedCredits} créditos ganados!`);
      setEarnedCredits(0);
      lastClaimRef.current = 0;
      setElapsedTime(0);
      
      // Update parent
      onUpdateUser({ ...user, credits: response.data.total_credits });
    } catch (error) {
      console.error("Error claiming credits:", error);
      toast.error("Error al reclamar créditos");
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const dismissNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const progressPercentage = ((elapsedTime % config.interval_seconds) / config.interval_seconds) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-slate-900/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LSE Hosting</h1>
                <p className="text-sm text-gray-400">Hola, {user.nombre}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  data-testid="notifications-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-300" />
                  {notifications.length > 0 && (
                    <span className="notification-badge">{notifications.length}</span>
                  )}
                </button>

                {showNotifications && notifications.length > 0 && (
                  <div className="absolute right-0 top-12 w-80 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50 max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-4 border-b border-slate-700 last:border-b-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`font-medium ${notif.type === 'credit_added' ? 'text-green-400' : 'text-red-400'}`}>
                              {notif.type === 'credit_added' ? '+' : '-'}{notif.amount} créditos
                            </p>
                            <p className="text-sm text-gray-400 mt-1">{notif.reason}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notif.timestamp).toLocaleString('es-ES')}
                            </p>
                          </div>
                          <button
                            onClick={() => dismissNotification(notif.id)}
                            className="text-gray-500 hover:text-white transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                data-testid="logout-btn"
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

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Visibility Warning */}
          {!isPageVisible && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-300">La pestaña no está visible. Los créditos se pausaron.</p>
            </div>
          )}

          {/* Credits Display */}
          <div className="credit-display animate-slide-up" data-testid="credits-display">
            <div className="relative z-10 text-center">
              <p className="text-gray-400 mb-2">Créditos Totales</p>
              <div className="text-6xl font-bold text-white mb-4 animate-pulse-glow">
                {credits}
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <Coins className="w-5 h-5" />
                <span className="text-sm font-medium">LSE Credits</span>
              </div>
            </div>
          </div>

          {/* Earning Progress */}
          <div className="glass rounded-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Ganando Créditos</h3>
              <div className="flex items-center gap-2 text-green-400">
                <TrendingUp className="w-5 h-5" />
                <span className="font-bold">+{earnedCredits}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Progreso</span>
                <span className="text-gray-400">
                  {elapsedTime % config.interval_seconds}s / {config.interval_seconds}s
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-gray-400 text-sm mb-1">Tiempo Activo</p>
                <p className="text-2xl font-bold text-white">{Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Ganancia por Intervalo</p>
                <p className="text-2xl font-bold text-white">{config.credits_per_interval}</p>
              </div>
            </div>

            {earnedCredits > 0 && (
              <button
                data-testid="claim-credits-btn"
                onClick={claimCredits}
                className="w-full btn-primary py-3 mt-4"
              >
                Reclamar {earnedCredits} Créditos
              </button>
            )}
          </div>

          {/* Info */}
          <div className="glass rounded-2xl p-6">
            <h4 className="text-lg font-bold text-white mb-4">¿Cómo funciona?</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">•</span>
                <span>Mantén esta pestaña visible para ganar créditos automáticamente</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">•</span>
                <span>Ganas {config.credits_per_interval} crédito cada {config.interval_seconds} segundos</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">•</span>
                <span>Los créditos se reclaman automáticamente cuando cambias de pestaña</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}