import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Lock, 
  LogOut, 
  Home, 
  ShoppingCart, 
  TrendingUp, 
  Package, 
  Users, 
  Tags, 
  Receipt, 
  CreditCard, 
  BarChart3, 
  Settings,
  FileText,
  Gift,
  Clock,
  AlertTriangle,
  FileBarChart,
  UserCog,
  Truck,
} from 'lucide-react';
import logoGulReyhan from '@/assets/logo-gul-reyhan-2.png';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

interface TopNavigationProps {
  onLockScreen: () => void;
}

export function TopNavigation({ onLockScreen }: TopNavigationProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const topMenuItems = [
    { icon: ShoppingCart, label: "Caisse", path: "/" },
    { icon: Receipt, label: "Ventes", path: "/sales" },
    { icon: Package, label: "Produits", path: "/products" },
    { icon: TrendingUp, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Factures", path: "/invoices" },
    { icon: FileText, label: "Commandes", path: "/orders" },
    { icon: BarChart3, label: "Analyses", path: "/analytics" },
    { icon: FileBarChart, label: "Rapports", path: "/reports-history" },
  ];

  const bottomMenuItems = [
    { icon: Truck, label: "Stock", path: "/inventory" },
    { icon: Clock, label: "Historique", path: "/stock-history" },
    { icon: Truck, label: "Fournisseurs", path: "/suppliers" },
    { icon: Users, label: "Clients", path: "/customers" },
    { icon: Gift, label: "Fidélité", path: "/loyalty" },
    { icon: CreditCard, label: "Paiements", path: "/payments" },
    { icon: Tags, label: "Promotions", path: "/promotions" },
    { icon: AlertTriangle, label: "Remboursements", path: "/refunds" },
    { icon: Settings, label: "Configuration", path: "/settings" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary to-primary-glow shadow-lg">
      <div className="flex flex-col">
        {/* Première ligne - Principaux */}
        <div className="flex h-14 items-center gap-4 px-6">
          {/* Logo */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="shrink-0 gap-2 font-semibold hover:bg-white/10 text-white"
          >
            <img src={logoGulReyhan} alt="Gül Reyhan" className="h-8 w-8" />
            <span className="hidden xl:inline">Gül Reyhan Market</span>
          </Button>

          {/* Boutons principaux */}
          <div className="hidden lg:flex flex-1 gap-1 overflow-x-auto">
            {topMenuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className="h-9 px-3 text-sm font-medium text-white hover:bg-white/10 gap-2 whitespace-nowrap"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="h-9 w-9 text-white hover:bg-white/10"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <NotificationPanel 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onLockScreen}
              className="h-9 w-9 text-white hover:bg-white/10"
            >
              <Lock className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-9 w-9 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Deuxième ligne - Stock, Clients, Promos */}
        <div className="hidden lg:flex h-12 items-center gap-1 px-6 bg-white/5 border-t border-white/10 overflow-x-auto">
          {bottomMenuItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className="h-8 px-3 text-xs font-medium text-white hover:bg-white/10 gap-2 whitespace-nowrap"
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
