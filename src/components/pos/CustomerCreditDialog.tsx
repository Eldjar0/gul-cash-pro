import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerCreditAccount, useChargeCredit } from '@/hooks/useCustomerCredit';
import { Wallet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CustomerCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  totalAmount: number;
  onApply: (amount: number) => void;
}

export const CustomerCreditDialog = ({ open, onOpenChange, customerId, totalAmount, onApply }: CustomerCreditDialogProps) => {
  const [amountToCharge, setAmountToCharge] = useState('');
  
  const { data: creditAccount, isLoading } = useCustomerCreditAccount(customerId || undefined);
  const chargeCredit = useChargeCredit();

  const availableCredit = creditAccount 
    ? creditAccount.credit_limit - creditAccount.current_balance 
    : 0;

  const handleApply = () => {
    if (!customerId || !creditAccount) {
      return;
    }

    const amount = parseFloat(amountToCharge);

    if (amount <= 0 || amount > totalAmount) {
      return;
    }

    if (amount > availableCredit) {
      return;
    }

    onApply(amount);
    onOpenChange(false);
    setAmountToCharge('');
  };

  if (!customerId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client Requis</DialogTitle>
            <DialogDescription>
              Sélectionnez un client pour utiliser le crédit
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Crédit Client
          </DialogTitle>
          <DialogDescription>
            Paiement différé sur compte client
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : !creditAccount ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ce client n'a pas de compte crédit actif
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Limite de crédit:</span>
                <span className="font-medium">{creditAccount.credit_limit.toFixed(2)} €</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Utilisé:</span>
                <span className="font-medium">{creditAccount.current_balance.toFixed(2)} €</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-semibold">Crédit disponible:</span>
                <span className="font-bold text-lg text-green-600">
                  {availableCredit.toFixed(2)} €
                </span>
              </div>
            </div>

            {availableCredit >= totalAmount ? (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-700">
                  ✓ Crédit suffisant pour couvrir la totalité
                </AlertDescription>
              </Alert>
            ) : availableCredit > 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Crédit partiel disponible ({availableCredit.toFixed(2)} €)
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Limite de crédit atteinte
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Montant à facturer au crédit</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={Math.min(availableCredit, totalAmount)}
                value={amountToCharge}
                onChange={(e) => setAmountToCharge(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Maximum: {Math.min(availableCredit, totalAmount).toFixed(2)} €
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          {creditAccount && availableCredit > 0 && (
            <Button onClick={handleApply} disabled={!amountToCharge || parseFloat(amountToCharge) <= 0}>
              Appliquer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
