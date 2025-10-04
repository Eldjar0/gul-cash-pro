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

  const allMenuItems = [
    { icon: ShoppingCart, label: "Caisse", path: "/" },
    { icon: Receipt, label: "Ventes", path: "/sales" },
    { icon: Package, label: "Produits", path: "/products" },
    { icon: Truck, label: "Stock", path: "/inventory" },
    { icon: Users, label: "Clients", path: "/customers" },
    { icon: TrendingUp, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Factures", path: "/invoices" },
    { icon: FileText, label: "Commandes", path: "/orders" },
    { icon: BarChart3, label: "Analyses", path: "/analytics" },
    { icon: Gift, label: "Fidélité", path: "/loyalty" },
    { icon: Tags, label: "Promotions", path: "/promotions" },
    { icon: CreditCard, label: "Paiements", path: "/payments" },
    { icon: Clock, label: "Historique", path: "/stock-history" },
    { icon: Users, label: "Fournisseurs", path: "/suppliers" },
    { icon: AlertTriangle, label: "Remboursements", path: "/refunds" },
    { icon: FileBarChart, label: "Rapports", path: "/reports-history" },
    { icon: Settings, label: "Configuration", path: "/settings" },
    { icon: UserCog, label: "Utilisateurs", path: "/settings" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary to-primary-glow shadow-lg">
      <div className="flex h-16 items-center gap-6 px-6">
        {/* Logo */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="shrink-0 gap-2 font-semibold hover:bg-white/10 text-white"
        >
          <img src={logoGulReyhan} alt="Gül Reyhan" className="h-8 w-8" />
          <span>Gül Reyhan Market</span>
        </Button>

        {/* Navigation Menu */}
        <div className="hidden lg:flex flex-1 gap-1 overflow-hidden">
          <div className="flex gap-1 items-center">
            {/* Afficher les 6 premiers boutons sur grands écrans */}
            <div className="hidden 2xl:flex gap-1">
              {allMenuItems.slice(0, 6).map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className="h-9 px-3 text-sm font-medium text-white hover:bg-white/10 gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>

            {/* Afficher 4 boutons sur écrans moyens */}
            <div className="hidden xl:flex 2xl:hidden gap-1">
              {allMenuItems.slice(0, 4).map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className="h-9 px-3 text-sm font-medium text-white hover:bg-white/10 gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>

            {/* Afficher 3 boutons sur petits écrans lg */}
            <div className="flex xl:hidden gap-1">
              {allMenuItems.slice(0, 3).map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className="h-9 px-3 text-sm font-medium text-white hover:bg-white/10 gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Plus avec le reste */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9 px-3 text-sm font-medium text-white">
                  Plus
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[200px] gap-1 p-2 bg-popover max-h-[400px] overflow-y-auto">
                    {/* Afficher les éléments restants selon la taille d'écran */}
                    <div className="hidden 2xl:block">
                      {allMenuItems.slice(6).map((item) => (
                        <li key={item.path}>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-accent"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </button>
                        </li>
                      ))}
                    </div>
                    <div className="hidden xl:block 2xl:hidden">
                      {allMenuItems.slice(4).map((item) => (
                        <li key={item.path}>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-accent"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </button>
                        </li>
                      ))}
                    </div>
                    <div className="block xl:hidden">
                      {allMenuItems.slice(3).map((item) => (
                        <li key={item.path}>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-accent"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </button>
                        </li>
                      ))}
                    </div>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
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
    </nav>
  );
}
