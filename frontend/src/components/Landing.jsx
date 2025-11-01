import { Shield, Zap, Lock, TrendingUp } from "lucide-react";

export default function Landing({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">LSE Hosting</h1>
            </div>
            <button
              data-testid="header-login-btn"
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium transition-all border border-white/20"
            >
              Iniciar Sesión
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto animate-slide-up">
            <div className="inline-block px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full text-blue-300 text-sm font-medium mb-6 border border-blue-500/30">
              Free Version - Hosting Gratuito
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Hosting Gratuito
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                Con Créditos
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Gana créditos mientras navegas y úsalos para mantener tu hosting activo. Simple, rápido y completamente gratuito.
            </p>
            
            <button
              data-testid="hero-get-started-btn"
              onClick={onGetStarted}
              className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
            >
              Comenzar Ahora
              <Zap className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass rounded-2xl p-8 hover:bg-white/10 transition-all group" data-testid="feature-earn-credits">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Gana Créditos</h3>
              <p className="text-gray-400">
                Acumula créditos automáticamente mientras navegas en la plataforma. Cuanto más tiempo estés activo, más ganas.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 hover:bg-white/10 transition-all group" data-testid="feature-secure">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">100% Seguro</h3>
              <p className="text-gray-400">
                Tu cuenta y datos están protegidos con las últimas tecnologías de seguridad. Confía en nosotros.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 hover:bg-white/10 transition-all group" data-testid="feature-free">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Totalmente Gratis</h3>
              <p className="text-gray-400">
                Sin costos ocultos, sin tarifas mensuales. Solo gana créditos y disfruta de tu hosting gratuito.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="glass rounded-3xl p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              ¿Listo para comenzar?
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Únete a miles de usuarios que ya disfrutan de hosting gratuito con LSE Hosting.
            </p>
            <button
              data-testid="cta-get-started-btn"
              onClick={onGetStarted}
              className="btn-primary text-lg px-8 py-4"
            >
              Crear Cuenta Gratis
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-8 border-t border-white/10">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 LSE Hosting. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}