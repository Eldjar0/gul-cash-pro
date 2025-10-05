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
import logoNav from '@/assets/logo-gul-reyhan-nav.png';
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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 xl:h-14 items-center gap-1 xl:gap-2 px-2 xl:px-4">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="shrink-0 hover:opacity-80 transition-opacity"
        >
          <img src={logoNav} alt="Gül Reyhan" className="h-8 xl:h-10 w-auto" />
        </button>

        {/* Navigation Menu - Hidden on mobile */}
        <div className="hidden lg:flex flex-1 justify-center gap-1 xl:gap-1.5">
          {/* Bouton principal Caisse */}
          <Button
            onClick={() => navigate("/")}
            className="h-10 xl:h-11 px-2 xl:px-3 flex items-center gap-1.5 xl:gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            <ShoppingCart className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
            <span className="text-xs xl:text-sm">Caisse</span>
          </Button>

          {/* Menus déroulants simplifiés */}
          <NavigationMenu>
            <NavigationMenuList className="gap-1 xl:gap-1.5">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 xl:h-11 px-2 xl:px-3 flex items-center gap-1.5 xl:gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold data-[state=open]:bg-green-600">
                  <TrendingUp className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
                  <span className="text-xs xl:text-sm">Statistiques</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    {menuItems.rapports.map((item) => (
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
                <NavigationMenuTrigger className="h-10 xl:h-11 px-2 xl:px-3 flex items-center gap-1.5 xl:gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold data-[state=open]:bg-purple-600">
                  <Receipt className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
                  <span className="text-xs xl:text-sm">Ventes</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4">
                    {menuItems.ventes.map((item) => (
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
                <NavigationMenuTrigger className="h-10 xl:h-11 px-2 xl:px-3 flex items-center gap-1.5 xl:gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold data-[state=open]:bg-indigo-600">
                  <Package className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
                  <span className="text-xs xl:text-sm">Stock</span>
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
                <NavigationMenuTrigger className="h-10 xl:h-11 px-2 xl:px-3 flex items-center gap-1.5 xl:gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold data-[state=open]:bg-orange-600">
                  <Users className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
                  <span className="text-xs xl:text-sm">Clients</span>
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
                  className="h-10 xl:h-11 px-2 xl:px-3 flex items-center gap-1.5 xl:gap-2 bg-slate-500 hover:bg-slate-600 text-white font-semibold"
                >
                  <Settings className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
                  <span className="text-xs xl:text-sm">Paramètres</span>
                </Button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 xl:gap-1 ml-auto">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="h-9 w-9 xl:h-10 xl:w-10"
            >
              <Bell className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 xl:h-5 xl:w-5 p-0 flex items-center justify-center text-[10px] xl:text-xs">
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
            className="h-9 w-9 xl:h-10 xl:w-10"
          >
            <Lock className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
          </Button>

          <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l">
            <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-medium truncate max-w-[120px]">{user?.email}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-destructive hover:text-destructive h-9 w-9 xl:h-10 xl:w-10"
          >
            <LogOut className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
