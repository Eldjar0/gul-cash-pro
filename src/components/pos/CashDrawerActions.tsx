import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  FileText,
  Users,
  Package,
  Settings,
  LogOut,
  Calculator,
} from 'lucide-react';

interface CashDrawerActionsProps {
  onOpenDrawer: () => void;
  onViewStats: () => void;
  onViewHistory: () => void;
  onManageCustomers: () => void;
  onManageProducts: () => void;
  onSettings: () => void;
}

export function CashDrawerActions({
  onOpenDrawer,
  onViewStats,
  onViewHistory,
  onManageCustomers,
  onManageProducts,
  onSettings,
}: CashDrawerActionsProps) {
  return (
    <Card className="p-6 shadow-xl border-2 border-accent/20">
      <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
        ⚙️ Actions de caisse
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onOpenDrawer}
          className="h-20 flex flex-col gap-2 bg-gradient-to-br from-category-green to-primary text-white hover:scale-105 transition-all shadow-lg"
        >
          <DollarSign className="h-8 w-8" />
          <span className="font-bold">Ouvrir caisse</span>
        </Button>
        
        <Button
          onClick={onViewStats}
          className="h-20 flex flex-col gap-2 bg-gradient-to-br from-category-blue to-secondary text-white hover:scale-105 transition-all shadow-lg"
        >
          <TrendingUp className="h-8 w-8" />
          <span className="font-bold">Statistiques</span>
        </Button>
        
        <Button
          onClick={onViewHistory}
          className="h-20 flex flex-col gap-2 bg-gradient-to-br from-category-purple to-accent text-white hover:scale-105 transition-all shadow-lg"
        >
          <FileText className="h-8 w-8" />
          <span className="font-bold">Historique</span>
        </Button>
        
        <Button
          onClick={onManageCustomers}
          className="h-20 flex flex-col gap-2 bg-gradient-to-br from-category-teal to-pos-info text-white hover:scale-105 transition-all shadow-lg"
        >
          <Users className="h-8 w-8" />
          <span className="font-bold">Clients</span>
        </Button>
        
        <Button
          onClick={onManageProducts}
          className="h-20 flex flex-col gap-2 bg-gradient-to-br from-category-orange to-category-red text-white hover:scale-105 transition-all shadow-lg"
        >
          <Package className="h-8 w-8" />
          <span className="font-bold">Produits</span>
        </Button>
        
        <Button
          onClick={onSettings}
          className="h-20 flex flex-col gap-2 bg-gradient-to-br from-muted to-secondary text-white hover:scale-105 transition-all shadow-lg"
        >
          <Settings className="h-8 w-8" />
          <span className="font-bold">Paramètres</span>
        </Button>
      </div>
    </Card>
  );
}
