import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Lock, 
  LogOut, 
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
import logoHeader from '@/assets/logo-gul-reyhan-header.png';
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

  const menuItems = {
    ventes: [
      { icon: Receipt, label: "Ventes", path: "/" },
    ],
    gestion: [
      { icon: Package, label: "Produits", path: "/products" },
      { icon: Truck, label: "Stock", path: "/inventory" },
      { icon: Clock, label: "Historique", path: "/stock-history" },
      { icon: Users, label: "Fournisseurs", path: "/suppliers" },
    ],
    clients: [
      { icon: Users, label: "Clients", path: "/customers" },
      { icon: Gift, label: "Fidélité", path: "/loyalty" },
      { icon: Tags, label: "Promotions", path: "/promotions" },
    ],
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-primary to-primary-glow shadow-lg">
      <div className="flex h-12 items-center gap-1 px-2">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="shrink-0 hover:opacity-80 transition-opacity"
        >
          <img src={logoHeader} alt="Gül Reyhan" className="h-11 w-auto" />
        </button>

        {/* Navigation Menu - Toujours visible avec texte */}
        <div className="flex flex-1 justify-center gap-1">
          {/* Bouton principal Caisse */}
          <Button
            onClick={() => navigate("/")}
            className="h-10 px-2 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs whitespace-nowrap border border-white/40"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Caisse</span>
          </Button>
          
          {/* Bouton Documents */}
          <Button
            onClick={() => navigate("/documents")}
            className="h-10 px-2 flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs whitespace-nowrap"
          >
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </Button>

          {/* Menus déroulants simplifiés */}
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {/* Statistiques - Bouton direct */}
              <NavigationMenuItem>
                <Button
                  onClick={() => navigate("/stats")}
                  className="h-10 px-2 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold text-xs whitespace-nowrap"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Statistiques</span>
                </Button>
              </NavigationMenuItem>


              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 px-2 flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold data-[state=open]:bg-indigo-600 text-xs whitespace-nowrap">
                  <Package className="h-4 w-4" />
                  <span>Stock</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    {menuItems.gestion.map((item) => (
                      <li key={item.path}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 w-full rounded-md p-3 text-sm leading-none hover:bg-accent transition-colors"
                          >
                            <item.icon className="h-5 w-5 text-primary" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 px-2 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold data-[state=open]:bg-orange-600 text-xs whitespace-nowrap">
                  <Users className="h-4 w-4" />
                  <span>Clients</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    {menuItems.clients.map((item) => (
                      <li key={item.path}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 w-full rounded-md p-3 text-sm leading-none hover:bg-accent transition-colors"
                          >
                            <item.icon className="h-5 w-5 text-primary" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/settings")}
                  className="h-10 px-2 flex items-center gap-1.5 bg-slate-500 hover:bg-slate-600 text-white font-semibold text-xs whitespace-nowrap"
                >
                  <Settings className="h-4 w-4" />
                  <span>Réglages</span>
                </Button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="h-10 w-10 text-white hover:bg-white/20"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
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
            className="h-10 w-10 text-white hover:bg-white/20"
          >
            <Lock className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-10 w-10 text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
