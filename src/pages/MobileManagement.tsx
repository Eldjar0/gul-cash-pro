import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Package, FolderKanban, ShoppingCart, Scan, LogOut, Moon, Sun } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/contexts/AuthContext';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { supabase } from '@/integrations/supabase/client';
import { MobileBarcodeScanner } from '@/components/mobile/MobileBarcodeScanner';
import logoJlprod from '@/assets/logo-jlprod-new.png';

export default function MobileManagement() {
  const navigate = useNavigate();
  const { goToProducts, goToCategories, goToOrders, goToProduct, goToProductCreate } = useMobileNavigation();
  const weather = useWeather();
  const { signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('mobile-dark-mode');
    return saved === 'true';
  });
  const [mobileScannerOpen, setMobileScannerOpen] = useState(false);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mobile-dark-mode', darkMode.toString());
  }, [darkMode]);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  // Physical scanner (HID) detection
  useBarcodeScanner({
    onScan: async (barcode: string) => {
      console.log('[MobileManagement] Code scanné physiquement:', barcode);

      // Rechercher le produit
      let { data: productMain } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .eq('is_active', true)
        .maybeSingle();

      let product = productMain;

      if (!product) {
        const { data: barcodeData } = await supabase
          .from('product_barcodes')
          .select('product_id')
          .eq('barcode', barcode)
          .maybeSingle();

        if (barcodeData) {
          const { data: foundProduct } = await supabase
            .from('products')
            .select('*')
            .eq('id', barcodeData.product_id)
            .eq('is_active', true)
            .maybeSingle();

          product = foundProduct;
        }
      }

      if (product) {
        goToProduct(product.id);
      } else {
        goToProductCreate(barcode);
      }
    },
    enabled: true,
    minLength: 3,
  });

  const menuItems = [
    {
      title: 'Produits',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      action: goToProducts,
    },
    {
      title: 'Catégories',
      icon: FolderKanban,
      color: 'from-purple-500 to-purple-600',
      action: goToCategories,
    },
    {
      title: 'Commandes',
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      action: goToOrders,
    },
    {
      title: 'Scanner',
      icon: Scan,
      color: 'from-orange-500 to-orange-600',
      action: () => setMobileScannerOpen(true),
    },
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
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <img src={logoJlprod} alt="Logo" className="h-6 sm:h-8 w-auto" />
              </div>
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
        <div className="max-w-7xl mx-auto">
          {/* Message de bienvenue responsive */}
          <div className="px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">Bonjour 👋</h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              Que souhaitez-vous gérer ?
            </p>
          </div>

          {/* Menu principal - Grid responsive */}
          <div className="px-3 sm:px-4 md:px-6 pb-6 sm:pb-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {menuItems.map((item) => (
                <button
                  key={item.title}
                  className="group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all touch-manipulation"
                  onClick={item.action}
                  style={{
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
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
                      <item.icon 
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
              ))}
            </div>
          </div>

          {/* Message d'aide responsive */}
          <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground/60">
              Appuyez sur une carte pour commencer
            </p>
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
