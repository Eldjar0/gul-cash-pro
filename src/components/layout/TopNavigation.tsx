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
    <nav className="sticky top-0 z-50 w-full border-b-4 border-primary/30 bg-gradient-to-r from-primary via-primary-glow to-primary shadow-2xl">
      <div className="flex h-14 items-center gap-4 px-6">
        {/* Logo à gauche */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="shrink-0 text-primary-foreground hover:bg-white/20 h-10 px-3 gap-2 font-bold text-base transition-all hover:scale-105"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>CAISSE</span>
        </Button>

        {/* Séparateur */}
        <div className="h-8 w-px bg-white/30"></div>

        {/* Navigation Menu - Centré */}
        <div className="hidden lg:flex flex-1 gap-1.5 justify-center">
          <NavigationMenu>
            <NavigationMenuList className="gap-1.5">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9 px-4 bg-white/10 hover:bg-white/20 text-primary-foreground font-semibold border border-white/20 hover:border-white/40 data-[state=open]:bg-white/25 transition-all text-sm shadow-lg">
                  Ventes
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[280px] gap-1 p-3 bg-card shadow-2xl border border-border rounded-lg">
                    {menuItems.ventes.map((item) => (
                      <li key={item.path}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 w-full rounded-lg p-3 text-sm leading-none hover:bg-primary/10 transition-all hover:shadow-md group border border-transparent hover:border-primary/20"
                          >
                            <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9 px-4 bg-white/10 hover:bg-white/20 text-primary-foreground font-semibold border border-white/20 hover:border-white/40 data-[state=open]:bg-white/25 transition-all text-sm shadow-lg">
                  Gestion
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[280px] gap-1 p-3 bg-card shadow-2xl border border-border rounded-lg">
                    {menuItems.gestion.map((item) => (
                      <li key={item.path}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 w-full rounded-lg p-3 text-sm leading-none hover:bg-primary/10 transition-all hover:shadow-md group border border-transparent hover:border-primary/20"
                          >
                            <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9 px-4 bg-white/10 hover:bg-white/20 text-primary-foreground font-semibold border border-white/20 hover:border-white/40 data-[state=open]:bg-white/25 transition-all text-sm shadow-lg">
                  Clients
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[280px] gap-1 p-3 bg-card shadow-2xl border border-border rounded-lg">
                    {menuItems.clients.map((item) => (
                      <li key={item.path}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 w-full rounded-lg p-3 text-sm leading-none hover:bg-primary/10 transition-all hover:shadow-md group border border-transparent hover:border-primary/20"
                          >
                            <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9 px-4 bg-white/10 hover:bg-white/20 text-primary-foreground font-semibold border border-white/20 hover:border-white/40 data-[state=open]:bg-white/25 transition-all text-sm shadow-lg">
                  Rapports
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[280px] gap-1 p-3 bg-card shadow-2xl border border-border rounded-lg">
                    {menuItems.rapports.map((item) => (
                      <li key={item.path}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => navigate(item.path)}
                            className="flex items-center gap-3 w-full rounded-lg p-3 text-sm leading-none hover:bg-primary/10 transition-all hover:shadow-md group border border-transparent hover:border-primary/20"
                          >
                            <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</span>
                          </button>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9 px-4 bg-white/10 hover:bg-white/20 text-primary-foreground font-semibold border border-white/20 hover:border-white/40 data-[state=open]:bg-white/25 transition-all text-sm shadow-lg">
                  Paramètres
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[280px] gap-1 p-3 bg-card shadow-2xl border border-border rounded-lg">
                    <li>
                      <NavigationMenuLink asChild>
                        <button
                          onClick={() => navigate("/settings")}
                          className="flex items-center gap-3 w-full rounded-lg p-3 text-sm leading-none hover:bg-primary/10 transition-all hover:shadow-md group border border-transparent hover:border-primary/20"
                        >
                          <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Settings className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">Configuration</span>
                        </button>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <button
                          onClick={() => navigate("/settings")}
                          className="flex items-center gap-3 w-full rounded-lg p-3 text-sm leading-none hover:bg-primary/10 transition-all hover:shadow-md group border border-transparent hover:border-primary/20"
                        >
                          <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <UserCog className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">Utilisateurs</span>
                        </button>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Séparateur */}
        <div className="h-8 w-px bg-white/30"></div>

        {/* Actions à droite */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-primary-foreground hover:bg-white/20 h-10 w-10 transition-all hover:scale-110"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs shadow-lg">
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
            className="text-primary-foreground hover:bg-white/20 h-10 w-10 transition-all hover:scale-110"
          >
            <Lock className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-primary-foreground hover:bg-white/20 h-10 w-10 transition-all hover:scale-110"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
