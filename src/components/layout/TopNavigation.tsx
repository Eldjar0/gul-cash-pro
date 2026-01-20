import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Lock,
  LogOut, 
  ShoppingCart, 
  Package, 
  Users, 
  Tags, 
  BarChart3, 
  Settings,
  FileText,
  Smartphone,
  Trash2,
  PackagePlus,
  Menu,
  Monitor,
} from 'lucide-react';
import logoHeader from '@/assets/logo-gul-reyhan-header.png';
import { useAuth } from '@/contexts/AuthContext';
import { RemoteScanDialog } from '@/components/pos/RemoteScanDialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleProtectedNavigation = (route: string) => {
    setMenuOpen(false);
    setTargetRoute(route);
    setPinCode('');
    setPinDialogOpen(true);
  };

  const handleNavigation = (route: string) => {
    setMenuOpen(false);
    navigate(route);
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

  const menuItems = [
    { label: 'Caisse', icon: ShoppingCart, route: '/', color: 'bg-white/20 border border-white/40', protected: false, badge: true },
    { label: 'Documents', icon: FileText, route: '/documents', color: 'bg-emerald-500', protected: true },
    { label: 'Statistiques', icon: BarChart3, route: '/stats', color: 'bg-green-500', protected: true },
    { label: 'Produits', icon: Package, route: '/inventory-management', color: 'bg-indigo-500', protected: false },
    { label: 'Entrée', icon: PackagePlus, route: '/supplier-entry', color: 'bg-teal-500', protected: false },
    { label: 'Clients', icon: Users, route: '/customers', color: 'bg-orange-500', protected: false },
    { label: 'Promotions', icon: Tags, route: '/promotions', color: 'bg-pink-500', protected: false },
    { label: 'Pertes', icon: Trash2, route: '/losses', color: 'bg-red-600', protected: false },
    { label: 'Réglages', icon: Settings, route: '/settings', color: 'bg-slate-500', protected: true },
  ];

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

        {/* Menu complet - visible sur tablette et PC (md et plus) */}
        <div className="hidden md:flex flex-1 justify-center gap-1">
          {/* Bouton Caisse avec badge */}
          <Button
            onClick={() => navigate("/")}
            className="h-10 px-2 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs whitespace-nowrap border border-white/40"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Caisse</span>
            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[8px] bg-white/30 text-white border-0">
              <Monitor className="h-2.5 w-2.5 mr-0.5" />
              PC
            </Badge>
          </Button>
          
          <Button
            onClick={() => handleProtectedNavigation("/documents")}
            className="h-10 px-2 flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs whitespace-nowrap"
          >
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </Button>

          <Button
            onClick={() => handleProtectedNavigation("/stats")}
            className="h-10 px-2 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold text-xs whitespace-nowrap"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Statistiques</span>
          </Button>

          <Button
            onClick={() => navigate("/inventory-management")}
            className="h-10 px-2 flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs whitespace-nowrap"
          >
            <Package className="h-4 w-4" />
            <span>Produits</span>
          </Button>

          <Button
            onClick={() => navigate("/supplier-entry")}
            className="h-10 px-2 flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-xs whitespace-nowrap"
          >
            <PackagePlus className="h-4 w-4" />
            <span>Entrée</span>
          </Button>

          <Button
            onClick={() => navigate("/customers")}
            className="h-10 px-2 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs whitespace-nowrap"
          >
            <Users className="h-4 w-4" />
            <span>Clients</span>
          </Button>

          <Button
            onClick={() => navigate("/promotions")}
            className="h-10 px-2 flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs whitespace-nowrap"
          >
            <Tags className="h-4 w-4" />
            <span>Promotions</span>
          </Button>

          <Button
            onClick={() => navigate("/losses")}
            className="h-10 px-2 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs whitespace-nowrap"
          >
            <Trash2 className="h-4 w-4" />
            <span>Pertes</span>
          </Button>

          <Button
            onClick={() => handleProtectedNavigation("/settings")}
            className="h-10 px-2 flex items-center gap-1.5 bg-slate-500 hover:bg-slate-600 text-white font-semibold text-xs whitespace-nowrap"
          >
            <Settings className="h-4 w-4" />
            <span>Réglages</span>
          </Button>

          <Button
            onClick={() => setRemoteScanOpen(true)}
            className="h-10 px-2 flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs whitespace-nowrap"
          >
            <Smartphone className="h-4 w-4" />
            <span>Scan Mobile</span>
          </Button>
        </div>

        {/* Menu burger - visible uniquement sur mobile (moins de md) */}
        <div className="flex md:hidden flex-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            className="h-10 w-10 text-white hover:bg-white/20"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto md:ml-0">
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

      {/* Menu Burger Sheet - uniquement mobile */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-80 p-0">
          <SheetHeader className="p-4 border-b bg-gradient-to-r from-primary to-primary-glow">
            <SheetTitle className="text-white flex items-center gap-2">
              <img src={logoHeader} alt="Logo" className="h-8 w-auto" />
              Menu
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <div className="p-3 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.route}
                    variant="ghost"
                    className={`w-full justify-start h-12 px-3 gap-3 ${item.color} hover:opacity-90 text-white`}
                    onClick={() => item.protected ? handleProtectedNavigation(item.route) : handleNavigation(item.route)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px] bg-white/30 text-white border-0">
                        <Monitor className="h-3 w-3 mr-0.5" />
                        PC/Tablette
                      </Badge>
                    )}
                    {item.protected && (
                      <Lock className="h-3 w-3 ml-auto opacity-60" />
                    )}
                  </Button>
                );
              })}

              <Separator className="my-3" />

              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-3 gap-3 bg-blue-500 hover:opacity-90 text-white"
                onClick={() => {
                  setMenuOpen(false);
                  setRemoteScanOpen(true);
                }}
              >
                <Smartphone className="h-5 w-5" />
                <span className="font-medium">Scan Mobile</span>
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

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
