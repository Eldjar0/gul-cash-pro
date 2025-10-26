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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        {/* Header moderne */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <img src={logoJlprod} alt="Logo" className="h-8 w-auto" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Gestion Mobile</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  {weather.temperature && (
                    <span>• {weather.temperature}°C</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
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
          <p className="text-muted-foreground">Que souhaitez-vous gérer aujourd'hui ?</p>
        </div>

        {/* Menu principal - Design moderne */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item, index) => (
              <Card
                key={item.title}
                className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
                onClick={item.action}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className={`relative bg-gradient-to-br ${item.color} p-8 aspect-square flex flex-col items-center justify-center`}>
                  {/* Effet de brillance */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Icône */}
                  <item.icon className="h-16 w-16 text-white mb-3 drop-shadow-lg transform group-hover:scale-110 transition-transform" />
                  
                  {/* Titre */}
                  <h3 className="font-bold text-white text-lg text-center drop-shadow-md">
                    {item.title}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        </div>
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
