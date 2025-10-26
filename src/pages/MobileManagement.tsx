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
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
        {/* Header moderne avec glassmorphism */}
        <div className="sticky top-0 z-10 backdrop-blur-2xl bg-background/70 border-b border-border/50 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent opacity-50" />
                <img src={logoJlprod} alt="Logo" className="h-9 w-auto relative z-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Gestion Mobile
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">{currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  {weather.temperature && (
                    <>
                      <span>•</span>
                      <span className="font-medium">{weather.temperature}°C</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-accent/50 transition-all"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Message de bienvenue avec animation */}
        <div className="px-5 pt-8 pb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
            Bonjour 👋
          </h2>
          <p className="text-muted-foreground text-base">Que souhaitez-vous gérer aujourd'hui ?</p>
        </div>

        {/* Menu principal - Design ultra moderne */}
        <div className="px-5 pb-8">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item, index) => (
              <Card
                key={item.title}
                className="group cursor-pointer overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.03] active:scale-[0.97] animate-scale-in backdrop-blur-sm"
                onClick={item.action}
                style={{
                  animationDelay: `${200 + index * 100}ms`,
                  animationFillMode: 'backwards',
                }}
              >
                <div className={`relative bg-gradient-to-br ${item.color} p-6 aspect-square flex flex-col items-center justify-center overflow-hidden`}>
                  {/* Pattern de fond subtil */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
                  </div>
                  
                  {/* Effet de brillance au hover */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  {/* Badge indicateur */}
                  <div className="absolute top-3 right-3 w-2 h-2 bg-white/80 rounded-full shadow-lg" />
                  
                  {/* Conteneur icône avec animation */}
                  <div className="relative z-10 mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
                    <item.icon className="relative h-16 w-16 text-white drop-shadow-2xl" />
                  </div>
                  
                  {/* Titre avec meilleure lisibilité */}
                  <h3 className="relative z-10 font-bold text-white text-lg text-center drop-shadow-lg tracking-tight">
                    {item.title}
                  </h3>
                  
                  {/* Ligne décorative */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Indication de swipe (optionnel) */}
        <div className="px-5 pb-6 text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
          <p className="text-xs text-muted-foreground/60">
            Appuyez sur une carte pour commencer
          </p>
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
