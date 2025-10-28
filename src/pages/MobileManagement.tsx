import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package, FolderKanban, ShoppingCart, Scan, LogOut, Moon, Sun,
  Users, AlertTriangle, CreditCard
} from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/contexts/AuthContext';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { useMobileStats } from '@/hooks/useMobileStats';
import { useMobileAlerts } from '@/hooks/useMobileAlerts';
import { supabase } from '@/integrations/supabase/client';
import { MobileBarcodeScanner } from '@/components/mobile/MobileBarcodeScanner';
import companyLogo from '@/assets/logo-gul-reyhan-header.png';

export default function MobileManagement() {
  const navigate = useNavigate();
  const { goToProduct, goToProductCreate } = useMobileNavigation();
  const weather = useWeather();
  const { signOut } = useAuth();
  const { data: stats, isLoading: statsLoading } = useMobileStats();
  const { data: alerts } = useMobileAlerts();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('mobile-dark-mode') === 'true');
  const [mobileScannerOpen, setMobileScannerOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('mobile-dark-mode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  useBarcodeScanner({
    onScan: async (barcode: string) => {
      const { data: product } = await supabase.from('products').select('*').eq('barcode', barcode).eq('is_active', true).maybeSingle();
      product ? goToProduct(product.id) : goToProductCreate(barcode);
    },
    enabled: true,
    minLength: 3,
  });

  const menuItems = [
    { title: 'Encaisser', icon: CreditCard, color: 'from-emerald-500 to-emerald-600', action: () => navigate('/mobile/pos') },
    { title: 'Produits', icon: Package, color: 'from-blue-500 to-blue-600', action: () => navigate('/mobile/products') },
    { title: 'Catégories', icon: FolderKanban, color: 'from-purple-500 to-purple-600', action: () => navigate('/mobile/categories') },
    { title: 'Scanner', icon: Scan, color: 'from-orange-500 to-orange-600', action: () => setMobileScannerOpen(true) },
    { title: 'Clients', icon: Users, color: 'from-indigo-500 to-indigo-600', action: () => navigate('/mobile/customers') },
    { title: 'Alertes', icon: AlertTriangle, color: 'from-red-500 to-red-600', action: () => navigate('/mobile/alerts'), badge: stats?.lowStockCount },
  ];

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header responsive avec safe areas */}
        <div 
          className="sticky top-0 z-10 bg-background/95 border-b border-border shadow-sm" 
          style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          <div className="safe-area-inset-top" />
          <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={companyLogo} alt="Logo" className="h-10 sm:h-12 w-auto" />
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold">Gestion Mobile</h1>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500" />
                  <span>{currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  {weather.temperature && (
                    <>
                      <span className="hidden xs:inline">•</span>
                      <span className="hidden xs:inline">{weather.temperature}°C</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                onClick={() => window.location.reload()}
                title="Recharger la page"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                onClick={() => navigate('/mobile/calculator')}
                title="Calculatrice"
              >
                <svg 
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Container principal avec max-width pour desktop */}
        <div className="max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
          {/* Message de bienvenue responsive et centré */}
          <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">Bonjour 👋</h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">
              Que souhaitez-vous gérer ?
            </p>
          </div>

          {/* Alertes */}
          {alerts?.some(a => a.type === 'cash_register_closed') && (
            <div className="px-3 sm:px-4 md:px-6 pb-3">
              <Card className="p-3 bg-destructive/10 border-destructive/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Caisse non ouverte</p>
                    <p className="text-xs text-destructive/80">Ouvrez la caisse pour commencer les ventes</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Menu principal - Grid responsive avec flex-1 pour remplir l'espace */}
          <div className="flex-1 px-3 sm:px-4 md:px-6 pb-4 flex items-center">
            <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    className="group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all touch-manipulation"
                    onClick={item.action}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute top-2 right-2 z-20 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                    <div className={`bg-gradient-to-br ${item.color} p-4 sm:p-5 md:p-6 aspect-square flex flex-col items-center justify-center relative`}>
                      {/* Pattern de fond */}
                      <div className="absolute inset-0 opacity-10">
                        <div 
                          className="absolute top-0 left-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-white/30 rounded-full" 
                          style={{ filter: 'blur(30px)' }} 
                        />
                        <div 
                          className="absolute bottom-0 right-0 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-white/20 rounded-full" 
                          style={{ filter: 'blur(25px)' }} 
                        />
                      </div>
                      
                      {/* Icône responsive */}
                      <div className="relative z-10 mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                        <Icon 
                          className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 text-white" 
                          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} 
                        />
                      </div>
                      
                      {/* Titre responsive */}
                      <h3 
                        className="relative z-10 font-bold text-white text-xs sm:text-sm md:text-base lg:text-lg text-center leading-tight" 
                        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                      >
                        {item.title}
                      </h3>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Safe area bottom pour iOS */}
        <div className="safe-area-inset-bottom" />
      </div>

      {/* Scanner mobile */}
      <MobileBarcodeScanner
        open={mobileScannerOpen}
        onClose={() => setMobileScannerOpen(false)}
        onProductFound={(product) => {
          setMobileScannerOpen(false);
          goToProduct(product.id);
        }}
        onProductNotFound={(barcode) => {
          setMobileScannerOpen(false);
          goToProductCreate(barcode);
        }}
      />
    </>
  );
}
