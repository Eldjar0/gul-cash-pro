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
    <Card className="p-4 shadow-xl border-2 border-accent/30">
      <h2 className="text-base font-semibold mb-3 text-foreground flex items-center gap-2">
        ⚙️ Actions caisse
      </h2>
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={onOpenDrawer}
          className="h-16 flex flex-col gap-1 bg-gradient-to-br from-category-green to-primary text-white hover:scale-105 transition-all shadow-lg text-xs"
        >
          <DollarSign className="h-5 w-5" />
          <span className="font-bold">Caisse</span>
        </Button>
        
        <Button
          onClick={onViewStats}
          className="h-16 flex flex-col gap-1 bg-gradient-to-br from-category-blue to-secondary text-white hover:scale-105 transition-all shadow-lg text-xs"
        >
          <TrendingUp className="h-5 w-5" />
          <span className="font-bold">Stats</span>
        </Button>
        
        <Button
          onClick={onViewHistory}
          className="h-16 flex flex-col gap-1 bg-gradient-to-br from-category-purple to-accent text-white hover:scale-105 transition-all shadow-lg text-xs"
        >
          <FileText className="h-5 w-5" />
          <span className="font-bold">Historique</span>
        </Button>
        
        <Button
          onClick={onManageCustomers}
          className="h-16 flex flex-col gap-1 bg-gradient-to-br from-category-teal to-pos-info text-white hover:scale-105 transition-all shadow-lg text-xs"
        >
          <Users className="h-5 w-5" />
          <span className="font-bold">Clients</span>
        </Button>
        
        <Button
          onClick={onManageProducts}
          className="h-16 flex flex-col gap-1 bg-gradient-to-br from-category-orange to-category-red text-white hover:scale-105 transition-all shadow-lg text-xs"
        >
          <Package className="h-5 w-5" />
          <span className="font-bold">Produits</span>
        </Button>
        
        <Button
          onClick={onSettings}
          className="h-16 flex flex-col gap-1 bg-gradient-to-br from-muted to-secondary text-white hover:scale-105 transition-all shadow-lg text-xs"
        >
          <Settings className="h-5 w-5" />
          <span className="font-bold">Config</span>
        </Button>
      </div>
    </Card>
  );
}
