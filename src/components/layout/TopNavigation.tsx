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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4">
        {/* Logo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="shrink-0"
        >
          <Home className="h-5 w-5" />
        </Button>

        {/* Navigation Menu - Hidden on mobile */}
        <div className="hidden lg:flex flex-1">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex-col gap-1 py-1">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-[11px] leading-tight">Ventes</span>
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
                <NavigationMenuTrigger className="flex-col gap-1 py-1">
                  <Package className="h-5 w-5" />
                  <span className="text-[11px] leading-tight">Gestion</span>
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
                <NavigationMenuTrigger className="flex-col gap-1 py-1">
                  <Users className="h-5 w-5" />
                  <span className="text-[11px] leading-tight">Clients</span>
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
                <NavigationMenuTrigger className="flex-col gap-1 py-1">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-[11px] leading-tight">Rapports</span>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/settings")}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres
                </Button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
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
          >
            <Lock className="h-5 w-5" />
          </Button>

          <div className="hidden md:flex items-center gap-2 pl-2 border-l">
            <UserCog className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{user?.email}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-destructive hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
