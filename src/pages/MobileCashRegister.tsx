import { useState } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTodayReport, useOpenDay, useCloseDay, getTodayReportData } from '@/hooks/useDailyReports';
import { Wallet, DollarSign, Lock, Unlock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function MobileCashRegister() {
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const { data: todayReport, isLoading } = useTodayReport();
  const openDay = useOpenDay();
  const closeDay = useCloseDay();

  const handleOpenRegister = async () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    try {
      await openDay.mutateAsync(amount);
      setOpeningAmount('');
      toast.success('Caisse ouverte avec succès');
    } catch (error) {
      console.error('Error opening register:', error);
    }
  };

  const handleCloseRegister = async () => {
    if (!todayReport) return;

    const amount = parseFloat(closingAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }

    try {
      const reportData = await getTodayReportData();
      await closeDay.mutateAsync({
        reportId: todayReport.id,
        closingAmount: amount,
        reportData,
      });
      setClosingAmount('');
      toast.success('Caisse fermée avec succès');
    } catch (error) {
      console.error('Error closing register:', error);
    }
  };

  if (isLoading) {
    return (
      <MobileLayout title="Gestion de Caisse">
        <div className="p-3 sm:p-4 space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </MobileLayout>
    );
  }

  const isOpen = todayReport !== null;

  return (
    <MobileLayout title="Gestion de Caisse">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-20">
          {/* Statut de la caisse */}
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 sm:p-3 rounded-full ${isOpen ? 'bg-primary/10' : 'bg-muted'}`}>
                  {isOpen ? (
                    <Unlock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  ) : (
                    <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Statut</p>
                  <p className="text-base sm:text-lg font-bold text-foreground">
                    {isOpen ? 'Ouverte' : 'Fermée'}
                  </p>
                </div>
              </div>
              <Badge variant={isOpen ? 'default' : 'secondary'} className="text-xs sm:text-sm">
                {isOpen ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {isOpen && todayReport && (
              <div className="pt-3 sm:pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Fond de caisse</span>
                  <span className="text-sm sm:text-base font-semibold text-foreground">
                    {todayReport.opening_amount.toFixed(2)}€
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Ventes aujourd'hui</span>
                  <span className="text-sm sm:text-base font-semibold text-foreground">
                    {todayReport.total_sales.toFixed(2)}€
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Actions */}
          {!isOpen ? (
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  Ouvrir la caisse
                </h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground mb-2 block">
                    Fond de caisse
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="text-base sm:text-lg"
                  />
                </div>
                <Button
                  onClick={handleOpenRegister}
                  disabled={openDay.isPending}
                  className="w-full"
                  size="lg"
                >
                  <Unlock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Ouvrir la caisse
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  Fermer la caisse
                </h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-foreground mb-2 block">
                    Montant en caisse
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(e.target.value)}
                    className="text-base sm:text-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comptez l'argent présent dans la caisse
                  </p>
                </div>
                <Button
                  onClick={handleCloseRegister}
                  disabled={closeDay.isPending}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Fermer la caisse
                </Button>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </MobileLayout>
  );
}
