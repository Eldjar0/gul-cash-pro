import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package, FolderKanban, ShoppingCart, Scan, LogOut, Moon, Sun,
  Users, Receipt, AlertTriangle, BarChart3, Wallet, Settings,
  Euro, TrendingUp, Clock
} from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/contexts/AuthContext';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { useMobileStats } from '@/hooks/useMobileStats';
import { useMobileActivity } from '@/hooks/useMobileActivity';
import { useMobileAlerts } from '@/hooks/useMobileAlerts';
import { supabase } from '@/integrations/supabase/client';
import { MobileBarcodeScanner } from '@/components/mobile/MobileBarcodeScanner';
import companyLogo from '@/assets/logo-gul-reyhan-header.png';

export default function MobileManagement() {
  const navigate = useNavigate();
  const { goToProduct, goToProductCreate } = useMobileNavigation();
  const { data: weather } = useWeather();
  const { signOut } = useAuth();
  const { data: stats, isLoading: statsLoading } = useMobileStats();
  const { data: activities } = useMobileActivity(5);
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
    { title: 'Produits', icon: Package, color: 'from-blue-500/20 to-blue-600/20', action: () => navigate('/mobile/products') },
    { title: 'Catégories', icon: FolderKanban, color: 'from-purple-500/20 to-purple-600/20', action: () => navigate('/mobile/categories') },
    { title: 'Commandes', icon: ShoppingCart, color: 'from-green-500/20 to-green-600/20', action: () => navigate('/mobile/orders'), badge: stats?.pendingOrdersCount },
    { title: 'Scanner', icon: Scan, color: 'from-orange-500/20 to-orange-600/20', action: () => setMobileScannerOpen(true) },
    { title: 'Clients', icon: Users, color: 'from-indigo-500/20 to-indigo-600/20', action: () => navigate('/mobile/customers') },
    { title: 'Ventes', icon: Receipt, color: 'from-teal-500/20 to-teal-600/20', action: () => navigate('/mobile/sales') },
    { title: 'Alertes', icon: AlertTriangle, color: 'from-red-500/20 to-red-600/20', action: () => navigate('/mobile/alerts'), badge: stats?.lowStockCount },
    { title: 'Stats', icon: BarChart3, color: 'from-cyan-500/20 to-cyan-600/20', action: () => navigate('/mobile/stats') },
    { title: 'Caisse', icon: Wallet, color: 'from-emerald-500/20 to-emerald-600/20', action: () => navigate('/mobile/cash-register') },
    { title: 'Paramètres', icon: Settings, color: 'from-gray-500/20 to-gray-600/20', action: () => navigate('/settings') },
  ];

  const getActivityIcon = (type: string) => {
    const icons = { sale: Receipt, product_added: Package, product_updated: Package, stock_alert: AlertTriangle };
    const Icon = icons[type as keyof typeof icons] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const formatTimestamp = (timestamp: string) => {
    const diffMins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)}h`;
    return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <div className="min-h-screen bg-background pb-safe">
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b safe-area-inset-top">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <img src={companyLogo} alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base font-bold text-foreground truncate">Gul Reyhan Market</h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  {weather && <><span>•</span><span>{Math.round(weather.temperature)}°C</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="h-8 w-8">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-4 pb-20">
            {alerts?.some(a => a.type === 'cash_register_closed') && (
              <Card className="p-3 bg-destructive/10 border-destructive/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Caisse non ouverte</p>
                    <p className="text-xs text-destructive/80">Ouvrez la caisse pour commencer</p>
                  </div>
                </div>
              </Card>
            )}

            {statsLoading ? (
              <div className="grid grid-cols-3 gap-2"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Card className="p-2.5 sm:p-3">
                  <Euro className="h-3 w-3 sm:h-4 sm:w-4 text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">CA</p>
                  <p className="text-sm sm:text-lg font-bold truncate">{stats?.todayRevenue.toFixed(0)}€</p>
                </Card>
                <Card className="p-2.5 sm:p-3">
                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Ventes</p>
                  <p className="text-sm sm:text-lg font-bold">{stats?.todaySalesCount}</p>
                </Card>
                <Card className="p-2.5 sm:p-3">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Panier</p>
                  <p className="text-sm sm:text-lg font-bold truncate">{stats?.averageBasket.toFixed(0)}€</p>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.title} onClick={item.action} className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${item.color} border p-3 sm:p-4 flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all`}>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant="destructive" className="absolute top-1.5 right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px]">{item.badge > 99 ? '99+' : item.badge}</Badge>
                    )}
                    <div className="p-1.5 rounded-full bg-background/50">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-center">{item.title}</span>
                  </button>
                );
              })}
            </div>

            {activities && activities.length > 0 && (
              <div>
                <h2 className="text-sm font-bold mb-2">Activité Récente</h2>
                <Card className="divide-y">
                  {activities.map((activity) => (
                    <div key={activity.id} className="p-2.5 flex items-center gap-2 hover:bg-accent/50">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatTimestamp(activity.timestamp)}</span>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <MobileBarcodeScanner
        open={mobileScannerOpen}
        onClose={() => setMobileScannerOpen(false)}
        onProductFound={(product) => { setMobileScannerOpen(false); goToProduct(product.id); }}
        onProductNotFound={(barcode) => { setMobileScannerOpen(false); goToProductCreate(barcode); }}
      />
    </>
  );
}
