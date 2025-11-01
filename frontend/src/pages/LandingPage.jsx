import { useState, useContext } from "react";
import { AuthContext } from "../App";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Server, Zap, Shield, Gift } from "lucide-react";

export default function LandingPage() {
  const { login, register } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  // Register form
  const [registerData, setRegisterData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    username: "",
    password: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.username, loginData.password);
      toast.success("¡Bienvenido de vuelta!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerData);
      toast.success("¡Cuenta creada exitosamente!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 relative overflow-hidden">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-48 -left-48 animate-float"></div>
        <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-64 h-64 bg-pink-500/10 rounded-full blur-3xl top-1/2 left-1/2 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">LSE Hosting</span>
              <span className="text-sm bg-purple-500/30 text-purple-200 px-2 py-1 rounded-full">Free</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Hosting Gratuito
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Ilimitado
                </span>
              </h1>
              <p className="text-xl text-purple-200">
                Gana créditos gratis solo por estar en la web y canjéalos por servidores de hosting premium.
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start space-x-3 glass-effect p-4 rounded-xl">
                  <Zap className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold">Créditos Automáticos</h3>
                    <p className="text-purple-200 text-sm">Gana créditos cada 5 minutos</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 glass-effect p-4 rounded-xl">
                  <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold">100% Seguro</h3>
                    <p className="text-purple-200 text-sm">Tus datos protegidos</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 glass-effect p-4 rounded-xl">
                  <Server className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold">Servidores Premium</h3>
                    <p className="text-purple-200 text-sm">Alta velocidad y uptime</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 glass-effect p-4 rounded-xl">
                  <Gift className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold">Sin Pagos</h3>
                    <p className="text-purple-200 text-sm">Totalmente gratuito</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Auth Forms */}
            <div className="lg:pl-12">
              <Card className="glass-effect border-purple-500/30 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Comienza Ahora</CardTitle>
                  <CardDescription className="text-purple-200">
                    Crea tu cuenta gratis y empieza a ganar créditos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={isLogin ? "login" : "register"} onValueChange={(v) => setIsLogin(v === "login")}>
                    <TabsList className="grid w-full grid-cols-2 bg-purple-900/50">
                      <TabsTrigger value="login" data-testid="login-tab" className="data-[state=active]:bg-purple-600">Iniciar Sesión</TabsTrigger>
                      <TabsTrigger value="register" data-testid="register-tab" className="data-[state=active]:bg-purple-600">Registrarse</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login" className="space-y-4 mt-4">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-username" className="text-white">Usuario</Label>
                          <Input
                            id="login-username"
                            data-testid="login-username-input"
                            type="text"
                            placeholder="tu_usuario"
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            required
                            className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-white">Contraseña</Label>
                          <Input
                            id="login-password"
                            data-testid="login-password-input"
                            type="password"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                            className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
                          />
                        </div>
                        <Button
                          type="submit"
                          data-testid="login-submit-button"
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold"
                          disabled={loading}
                        >
                          {loading ? "Cargando..." : "Iniciar Sesión"}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="register" className="space-y-4 mt-4">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="register-nombre" className="text-white">Nombre</Label>
                            <Input
                              id="register-nombre"
                              data-testid="register-nombre-input"
                              type="text"
                              placeholder="Juan"
                              value={registerData.nombre}
                              onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
                              required
                              className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="register-apellidos" className="text-white">Apellidos</Label>
                            <Input
                              id="register-apellidos"
                              data-testid="register-apellidos-input"
                              type="text"
                              placeholder="Pérez"
                              value={registerData.apellidos}
                              onChange={(e) => setRegisterData({ ...registerData, apellidos: e.target.value })}
                              required
                              className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-email" className="text-white">Email</Label>
                          <Input
                            id="register-email"
                            data-testid="register-email-input"
                            type="email"
                            placeholder="tu@email.com"
                            value={registerData.email}
                            onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                            required
                            className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-username" className="text-white">Usuario</Label>
                          <Input
                            id="register-username"
                            data-testid="register-username-input"
                            type="text"
                            placeholder="tu_usuario"
                            value={registerData.username}
                            onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                            required
                            className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password" className="text-white">Contraseña</Label>
                          <Input
                            id="register-password"
                            data-testid="register-password-input"
                            type="password"
                            placeholder="••••••••"
                            value={registerData.password}
                            onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            required
                            className="bg-purple-900/30 border-purple-500/50 text-white placeholder:text-purple-300"
                          />
                        </div>
                        <Button
                          type="submit"
                          data-testid="register-submit-button"
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold"
                          disabled={loading}
                        >
                          {loading ? "Cargando..." : "Crear Cuenta"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
