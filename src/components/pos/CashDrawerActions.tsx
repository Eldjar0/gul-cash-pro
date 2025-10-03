import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, FileText, Users, Package, Settings, LogOut, Calculator, Calendar, CalendarX, FileBarChart } from 'lucide-react';
interface CashDrawerActionsProps {
  onOpenDrawer: () => void;
  onViewStats: () => void;
  onViewHistory: () => void;
  onManageCustomers: () => void;
  onManageProducts: () => void;
  onSettings: () => void;
  onOpenDay?: () => void;
  onCloseDay?: () => void;
  onReportX?: () => void;
  isDayOpen?: boolean;
}
export function CashDrawerActions({
  onOpenDrawer,
  onViewStats,
  onViewHistory,
  onManageCustomers,
  onManageProducts,
  onSettings,
  onOpenDay,
  onCloseDay,
  onReportX,
  isDayOpen = false
}: CashDrawerActionsProps) {
  return <Card className="p-4 shadow-xl border-2 border-accent/30">
      <h2 className="text-base font-semibold mb-3 text-foreground flex items-center gap-2">
        ⚙️ Actions caisse
      </h2>
      
      {/* Gestion de journée */}
      {(onOpenDay || onCloseDay || onReportX) && (
        <div className="mb-3 pb-3 border-b">
          <h3 className="text-xs font-semibold mb-2 text-muted-foreground">Gestion de journée</h3>
          
          {!isDayOpen ? (
            // Journée fermée: seulement le bouton Ouvrir
            <Button 
              onClick={onOpenDay} 
              className="w-full h-16 flex flex-col gap-1 bg-gradient-to-br from-accent to-primary text-white hover:scale-105 transition-all shadow-lg text-xs"
            >
              <Calendar className="h-5 w-5" />
              <span className="font-bold">Ouvrir Journée</span>
            </Button>
          ) : (
            // Journée ouverte: boutons Rapport X et Fermer
            <div className="grid grid-cols-2 gap-2">
              {onReportX && (
                <Button 
                  onClick={onReportX} 
                  className="h-16 flex flex-col gap-1 bg-gradient-to-br from-category-blue to-secondary text-white hover:scale-105 transition-all shadow-lg text-xs"
                >
                  <FileBarChart className="h-5 w-5" />
                  <span className="font-bold">Rapport X</span>
                </Button>
              )}
              {onCloseDay && (
                <Button 
                  onClick={onCloseDay} 
                  className="h-16 flex flex-col gap-1 bg-gradient-to-br from-destructive to-destructive/80 text-white hover:scale-105 transition-all shadow-lg text-xs"
                >
                  <CalendarX className="h-5 w-5" />
                  <span className="font-bold">Fermer Journée</span>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions principales */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={onOpenDrawer}
          className="h-14 flex flex-col gap-1 bg-gradient-to-br from-green-500 to-green-600 text-white hover:text-white hover:from-green-600 hover:to-green-700 transition-all hover:scale-105 shadow-md"
        >
          <DollarSign className="h-5 w-5" />
          <span className="text-xs font-bold">Tiroir</span>
        </Button>

        <Button
          variant="outline"
          onClick={onViewStats}
          className="h-14 flex flex-col gap-1 hover:scale-105 transition-all"
        >
          <TrendingUp className="h-5 w-5" />
          <span className="text-xs font-semibold">Stats</span>
        </Button>

        <Button
          variant="outline"
          onClick={onViewHistory}
          className="h-14 flex flex-col gap-1 hover:scale-105 transition-all"
        >
          <FileText className="h-5 w-5" />
          <span className="text-xs font-semibold">Historique</span>
        </Button>

        <Button
          variant="outline"
          onClick={onManageCustomers}
          className="h-14 flex flex-col gap-1 hover:scale-105 transition-all"
        >
          <Users className="h-5 w-5" />
          <span className="text-xs font-semibold">Clients</span>
        </Button>

        <Button
          variant="outline"
          onClick={onManageProducts}
          className="h-14 flex flex-col gap-1 hover:scale-105 transition-all"
        >
          <Package className="h-5 w-5" />
          <span className="text-xs font-semibold">Produits</span>
        </Button>

        <Button
          variant="outline"
          onClick={onSettings}
          className="h-14 flex flex-col gap-1 hover:scale-105 transition-all"
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs font-semibold">Paramètres</span>
        </Button>
      </div>
    </Card>;
}