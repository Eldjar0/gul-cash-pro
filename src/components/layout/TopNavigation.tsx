import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, LogOut, User, ShoppingCart, Package, Users, Settings, History, Clock, LayoutDashboard, Undo2, BarChart3, Tag, Bell, PackageOpen } from 'lucide-react';
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
  return <nav className="bg-primary shadow-lg border-b border-primary-foreground/20">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logoGulReyhan} alt="Gül Reyhan Market" className="h-16 w-auto" />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" className="text-white hover:bg-white/20 gap-2">
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Tableau de bord
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/20 gap-2">
              <Link to="/">
                <ShoppingCart className="h-4 w-4" />
                Caisse
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/20 gap-2">
              <Link to="/sales">
                <History className="h-4 w-4" />
                Ventes
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/20 gap-2">
              <Link to="/refunds">
                <Undo2 className="h-4 w-4" />
                Remboursements
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/20 gap-2">
              <Link to="/analytics">
                <BarChart3 className="h-4 w-4" />
                Analytiques
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/20 gap-2">
              <Link to="/promotions">
                <Tag className="h-4 w-4" />
                Promotions
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/20 gap-2">
              <Link to="/products">
                <Package className="h-4 w-4" />
                Produits
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/20 gap-2">
              <Link to="/stock-history">
                <PackageOpen className="h-4 w-4" />
                Mouvements Stock
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/20 gap-2">
              <Link to="/customers">
                <Users className="h-4 w-4" />
                Clients
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/20 gap-2">
              <Link to="/reports-history">
                <History className="h-4 w-4" />
                Historique
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/20 gap-2">
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                Paramètres
              </Link>
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <Button 
                onClick={() => setShowNotifications(!showNotifications)} 
                variant="outline" 
                size="icon" 
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white relative" 
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
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
            <Button onClick={onLockScreen} variant="outline" size="icon" className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white" title="Verrouiller la caisse">
              <Lock className="h-5 w-5" />
            </Button>

            {/* User Info & Logout */}
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-white/30">
              <User className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">
                {user?.email?.split('@')[0] || 'Admin'}
              </span>
              <Button onClick={handleSignOut} variant="ghost" size="icon" className="text-white hover:bg-white/20" title="Se déconnecter">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Logout */}
            <Button onClick={handleSignOut} variant="ghost" size="icon" className="sm:hidden text-white hover:bg-white/20" title="Se déconnecter">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>;
}