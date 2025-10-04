import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, LogOut, User, ShoppingCart, Package, Users, Settings, History, Clock, LayoutDashboard, Undo2, BarChart3, Tag, Bell, PackageOpen, Truck, FileText, Gift, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { useState } from 'react';
import logoGulReyhan from '@/assets/logo-gul-reyhan.png';
interface TopNavigationProps {
  onLockScreen: () => void;
}
export function TopNavigation({
  onLockScreen
}: TopNavigationProps) {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  return <nav className="bg-primary shadow-lg border-b border-primary-foreground/20 flex-shrink-0">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-12 md:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0">
            <img src={logoGulReyhan} alt="Gül Reyhan Market" className="h-10 w-auto md:h-14" />
          </Link>

          {/* Navigation Links - Hidden on mobile, scrollable on tablet, full on desktop */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 overflow-x-auto flex-1 mx-2 scrollbar-hide">
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/dashboard">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Tableau de bord</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/">
                <ShoppingCart className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Caisse</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/sales">
                <History className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Ventes</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/refunds">
                <Undo2 className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Remboursements</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/analytics">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Analytiques</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/promotions">
                <Tag className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Promotions</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/products">
                <Package className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Produits</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/stock-history">
                <PackageOpen className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Mouvements</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/inventory">
                <Truck className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Inventaire</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/orders">
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Devis</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/loyalty">
                <Gift className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Fidélité</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/payments">
                <CreditCard className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Paiements</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/customers">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Clients</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/reports-history">
                <History className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Historique</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 gap-1 text-xs whitespace-nowrap h-8">
              <Link to="/settings">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Paramètres</span>
              </Link>
            </Button>
          </div>

          {/* Actions - Compact on mobile */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Notifications */}
            <div className="relative">
              <Button 
                onClick={() => setShowNotifications(!showNotifications)} 
                variant="outline" 
                size="icon" 
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white relative h-8 w-8 md:h-10 md:w-10" 
                title="Notifications"
              >
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              <NotificationPanel 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
              />
            </div>
            
            {/* Lock Button */}
            <Button onClick={onLockScreen} variant="outline" size="icon" className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white h-8 w-8 md:h-10 md:w-10" title="Verrouiller la caisse">
              <Lock className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            {/* User Info & Logout - Hidden on small screens */}
            <div className="hidden md:flex items-center gap-2 ml-2 pl-2 border-l border-white/30">
              <User className="h-4 w-4 md:h-5 md:w-5 text-white" />
              <span className="text-xs md:text-sm font-medium text-white max-w-[100px] truncate">
                {user?.email?.split('@')[0] || 'Admin'}
              </span>
              <Button onClick={handleSignOut} variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 md:h-10 md:w-10" title="Se déconnecter">
                <LogOut className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            {/* Mobile Logout */}
            <Button onClick={handleSignOut} variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/20 h-8 w-8" title="Se déconnecter">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>;
}