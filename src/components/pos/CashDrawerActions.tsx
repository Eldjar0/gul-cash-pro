import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, FileText, Users, Package, Settings, LogOut, Calculator, Calendar, CalendarX, FileBarChart } from 'lucide-react';
interface CashDrawerActionsProps {
  onOpenDay?: () => void;
  onCloseDay?: () => void;
  onReportX?: () => void;
  isDayOpen?: boolean;
}
export function CashDrawerActions({
  onOpenDay,
  onCloseDay,
  onReportX,
  isDayOpen = false
}: CashDrawerActionsProps) {
  return (
    <Card className="p-4 shadow-xl border-2 border-accent/30">
      <h2 className="text-base font-semibold mb-3 text-foreground flex items-center gap-2">
        📅 Gestion de Journée
      </h2>
      
      <div className="space-y-3">
        {!isDayOpen ? (
          // Journée fermée: seulement le bouton Ouvrir
          <Button 
            onClick={onOpenDay} 
            className="w-full h-20 flex flex-col gap-2 bg-accent text-white hover:brightness-110 active:brightness-90 transition-all duration-100 shadow-lg text-sm"
          >
            <Calendar className="h-6 w-6" />
            <span className="font-bold">Ouvrir Journée</span>
          </Button>
        ) : (
          // Journée ouverte: boutons Rapport X, Fermer et Ventes du jour
          <>
            <div className="grid grid-cols-2 gap-2">
              {onReportX && (
                <Button 
                  onClick={onReportX} 
                  className="h-20 flex flex-col gap-2 bg-category-blue text-white hover:brightness-110 active:brightness-90 transition-all duration-100 shadow-lg text-sm"
                >
                  <FileBarChart className="h-6 w-6" />
                  <span className="font-bold">Rapport X</span>
                </Button>
              )}
              {onCloseDay && (
                <Button 
                  onClick={onCloseDay} 
                  className="h-20 flex flex-col gap-2 bg-destructive text-white hover:brightness-110 active:brightness-90 transition-all duration-100 shadow-lg text-sm"
                >
                  <CalendarX className="h-6 w-6" />
                  <span className="font-bold">Fermer Journée</span>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}