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
        {/* Header optimisé iOS */}
        <div className="sticky top-0 z-10 bg-background/95 border-b border-border shadow-sm" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="safe-area-inset-top" />
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <img src={logoJlprod} alt="Logo" className="h-8 w-auto" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Gestion Mobile</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>{currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  {weather.temperature && (
                    <>
                      <span>•</span>
                      <span>{weather.temperature}°C</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Message de bienvenue */}
        <div className="px-4 pt-6 pb-4">
          <h2 className="text-2xl font-bold mb-1">Bonjour 👋</h2>
          <p className="text-muted-foreground">Que souhaitez-vous gérer ?</p>
        </div>

        {/* Menu principal - Optimisé iOS */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <button
                key={item.title}
                className="group relative overflow-hidden rounded-2xl shadow-lg active:scale-95 transition-transform touch-manipulation"
                onClick={item.action}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div className={`bg-gradient-to-br ${item.color} p-6 aspect-square flex flex-col items-center justify-center relative`}>
                  {/* Pattern de fond simplifié pour iOS */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-white/30 rounded-full" style={{ filter: 'blur(40px)' }} />
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/20 rounded-full" style={{ filter: 'blur(30px)' }} />
                  </div>
                  
                  {/* Icône */}
                  <div className="relative z-10 mb-3">
                    <item.icon className="h-14 w-14 text-white" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} />
                  </div>
                  
                  {/* Titre */}
                  <h3 className="relative z-10 font-bold text-white text-base text-center" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    {item.title}
                  </h3>
                </div>
              </button>
            ))}
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
