import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
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
  Smartphone,
} from 'lucide-react';
import logoHeader from '@/assets/logo-gul-reyhan-header.png';
import { useAuth } from '@/contexts/AuthContext';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { RemoteScanDialog } from '@/components/pos/RemoteScanDialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface TopNavigationProps {
  onLockScreen: () => void;
}

export function TopNavigation({ onLockScreen }: TopNavigationProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [remoteScanOpen, setRemoteScanOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [targetRoute, setTargetRoute] = useState<string>('');

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleProtectedNavigation = (route: string) => {
    setTargetRoute(route);
    setPinCode('');
    setPinDialogOpen(true);
  };

  const handlePinSubmit = () => {
    if (pinCode === '3679') {
      setPinDialogOpen(false);
      setPinCode('');
      navigate(targetRoute);
    } else {
      toast.error('Code incorrect');
      setPinCode('');
    }
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
            onClick={() => handleProtectedNavigation("/documents")}
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
                  onClick={() => handleProtectedNavigation("/stats")}
                  className="h-10 px-2 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold text-xs whitespace-nowrap"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Statistiques</span>
                </Button>
              </NavigationMenuItem>


              <NavigationMenuItem>
                <Button
                  onClick={() => navigate("/inventory-management")}
                  className="h-10 px-2 flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs whitespace-nowrap"
                >
                  <Package className="h-4 w-4" />
                  <span>Produits</span>
                </Button>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Button
                  onClick={() => navigate("/customers")}
                  className="h-10 px-2 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs whitespace-nowrap"
                >
                  <Users className="h-4 w-4" />
                  <span>Clients</span>
                </Button>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Button
                  onClick={() => navigate("/promotions")}
                  className="h-10 px-2 flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs whitespace-nowrap"
                >
                  <Tags className="h-4 w-4" />
                  <span>Promotions</span>
                </Button>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Button
                  variant="ghost"
                  onClick={() => handleProtectedNavigation("/settings")}
                  className="h-10 px-2 flex items-center gap-1.5 bg-slate-500 hover:bg-slate-600 text-white font-semibold text-xs whitespace-nowrap"
                >
                  <Settings className="h-4 w-4" />
                  <span>Réglages</span>
                </Button>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Button
                  onClick={() => setRemoteScanOpen(true)}
                  className="h-10 px-2 flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs whitespace-nowrap"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>Scan Mobile</span>
                </Button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
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

      <RemoteScanDialog open={remoteScanOpen} onOpenChange={setRemoteScanOpen} />
      
      {/* Dialog de vérification du code PIN */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Code d'accès requis
            </DialogTitle>
            <DialogDescription>
              Entrez le code PIN pour accéder à cette section
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              inputMode="numeric"
              placeholder="Entrez le code (4 chiffres)"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pinCode.length === 4) {
                  handlePinSubmit();
                }
              }}
              className="text-center text-2xl tracking-widest"
              maxLength={4}
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPinDialogOpen(false);
                setPinCode('');
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handlePinSubmit}
              disabled={pinCode.length !== 4}
              className="flex-1 bg-primary"
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
