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
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <img src={logoJlprod} alt="Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold">Gestion Mobile</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{currentTime.toLocaleTimeString('fr-FR')}</span>
                  {weather.temperature && (
                    <span>• {weather.temperature}°C</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Menu principal */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <Card
                key={item.title}
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={item.action}
              >
                <div className={`bg-gradient-to-br ${item.color} p-6 rounded-t-lg`}>
                  <item.icon className="h-12 w-12 text-white mx-auto" />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-lg">{item.title}</h3>
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
