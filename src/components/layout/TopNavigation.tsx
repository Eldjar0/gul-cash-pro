import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, LogOut, User, ShoppingCart, Package, Users, Settings, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logoJLProd from '@/assets/logo-jlprod.png';

interface TopNavigationProps {
  onLockScreen: () => void;
}

export function TopNavigation({ onLockScreen }: TopNavigationProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className="bg-primary shadow-lg border-b border-primary-foreground/20">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logoJLProd} alt="JLProd" className="h-10 w-auto" />
            <span className="text-xl font-bold text-white hidden sm:block">Gül Reyhan</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" className="text-white hover:bg-white/20 gap-2">
                <ShoppingCart className="h-4 w-4" />
                Caisse
              </Button>
            </Link>
            <Link to="/sales">
              <Button variant="ghost" className="text-white hover:bg-white/20 gap-2">
                <History className="h-4 w-4" />
                Ventes
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="ghost" className="text-white hover:bg-white/20 gap-2">
                <Package className="h-4 w-4" />
                Produits
              </Button>
            </Link>
            <Link to="/customers">
              <Button variant="ghost" className="text-white hover:bg-white/20 gap-2">
                <Users className="h-4 w-4" />
                Clients
              </Button>
            </Link>
            <Link to="/reports-history">
              <Button variant="ghost" className="text-white hover:bg-white/20 gap-2">
                <History className="h-4 w-4" />
                Historique
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" className="text-white hover:bg-white/20 gap-2">
                <Settings className="h-4 w-4" />
                Paramètres
              </Button>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Lock Button */}
            <Button
              onClick={onLockScreen}
              variant="outline"
              size="icon"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white"
              title="Verrouiller la caisse"
            >
              <Lock className="h-5 w-5" />
            </Button>

            {/* User Info & Logout */}
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-white/30">
              <User className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">
                {user?.email?.split('@')[0] || 'Admin'}
              </span>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                title="Se déconnecter"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Logout */}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="icon"
              className="sm:hidden text-white hover:bg-white/20"
              title="Se déconnecter"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
