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
      { icon: ShoppingCart, label: "Caisse", path: "/" },
      { icon: Receipt, label: "Ventes", path: "/sales" },
      { icon: FileText, label: "Factures", path: "/invoices" },
      { icon: FileText, label: "Commandes", path: "/orders" },
      { icon: AlertTriangle, label: "Remboursements", path: "/refunds" },
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
      { icon: CreditCard, label: "Paiements", path: "/payments" },
    ],
    rapports: [
      { icon: TrendingUp, label: "Dashboard", path: "/dashboard" },
      { icon: BarChart3, label: "Analyses", path: "/analytics" },
      { icon: FileBarChart, label: "Rapports", path: "/reports-history" },
    ],
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-blue-600 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shadow-lg">
      <div className="flex h-16 items-center gap-6 px-4">
        {/* Logo à gauche */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="shrink-0 text-white hover:bg-white/20 h-12 px-4 gap-3"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="text-lg font-bold">CAISSE</span>
        </Button>

        {/* Séparateur */}
        <div className="h-10 w-px bg-white/30"></div>

        {/* Navigation Menu - Centré */}
        <div className="hidden lg:flex flex-1 gap-2 justify-center">
          {/* Boutons principaux sans icônes */}
          <Button
            onClick={() => navigate("/dashboard")}
            className="h-10 px-3 bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 hover:border-white/40 transition-all text-sm"
          >
            Dashboard
          </Button>
          
          <Button
            onClick={() => navigate("/products")}
            className="h-10 px-3 bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 hover:border-white/40 transition-all text-sm"
          >
            Produits
          </Button>
          
          <Button
            onClick={() => navigate("/customers")}
            className="h-10 px-3 bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 hover:border-white/40 transition-all text-sm"
          >
            Clients
          </Button>

          {/* Menus déroulants */}
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 px-3 gap-2 bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 hover:border-white/40 data-[state=open]:bg-white/30 transition-all text-sm">
                  Ventes
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 bg-white">
                    {menuItems.ventes.slice(1).map((item) => (
                      <li key={item.path}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 w-full rounded-md p-3 text-sm leading-none hover:bg-blue-50 transition-colors"
                          >
                            <item.icon className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 px-3 gap-2 bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 hover:border-white/40 data-[state=open]:bg-white/30 transition-all text-sm">
                  Gestion
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 bg-white">
                    {menuItems.gestion.slice(1).map((item) => (
                      <li key={item.path}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 w-full rounded-md p-3 text-sm leading-none hover:bg-blue-50 transition-colors"
                          >
                            <item.icon className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 px-3 gap-2 bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 hover:border-white/40 data-[state=open]:bg-white/30 transition-all text-sm">
                  Marketing
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 bg-white">
                    {menuItems.clients.slice(1).map((item) => (
                      <li key={item.path}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 w-full rounded-md p-3 text-sm leading-none hover:bg-blue-50 transition-colors"
                          >
                            <item.icon className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 px-3 gap-2 bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 hover:border-white/40 data-[state=open]:bg-white/30 transition-all text-sm">
                  Rapports
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 bg-white">
                    {menuItems.rapports.slice(1).map((item) => (
                      <li key={item.path}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 w-full rounded-md p-3 text-sm leading-none hover:bg-blue-50 transition-colors"
                          >
                            <item.icon className="h-5 w-5 text-blue-600" />
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
                  className="h-10 px-3 bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 hover:border-white/40 transition-all text-sm"
                >
                  Paramètres
                </Button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Séparateur */}
        <div className="h-10 w-px bg-white/30"></div>

        {/* Actions à droite */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-white hover:bg-white/20 h-12 w-12"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
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
            className="text-white hover:bg-white/20 h-12 w-12"
          >
            <Lock className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-white hover:bg-white/20 h-12 w-12"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
