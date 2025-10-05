import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerCreditAccount, useChargeCredit, useCreateCreditAccount } from '@/hooks/useCustomerCredit';
import { Wallet, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  totalAmount: number;
  onApply: (amount: number) => void;
}

export const CustomerCreditDialog = ({ 
  open, 
  onOpenChange, 
  customerId, 
  customerName,
  totalAmount, 
  onApply 
}: CustomerCreditDialogProps) => {
  const { data: creditAccount, refetch } = useCustomerCreditAccount(customerId);
  const chargeCredit = useChargeCredit();
  const createAccount = useCreateCreditAccount();
  
  const [amountToCharge, setAmountToCharge] = useState('');
  const [creditLimit, setCreditLimit] = useState('500');

  useEffect(() => {
    if (open && creditAccount) {
      setAmountToCharge(totalAmount.toFixed(2));
    }
  }, [open, totalAmount, creditAccount]);

  const handleCreateAccount = () => {
    const limit = parseFloat(creditLimit);
    
    if (limit <= 0) {
      toast.error('La limite doit être supérieure à 0');
      return;
    }

    createAccount.mutate({
      customerId,
      creditLimit: limit,
    }, {
      onSuccess: () => {
        toast.success('Compte crédit créé');
        refetch();
      }
    });
  };

  const handleCharge = () => {
    const amount = parseFloat(amountToCharge);
    
    if (!creditAccount || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }

    if (amount > totalAmount) {
      toast.error('Montant supérieur au total de la vente');
      return;
    }

    const newBalance = creditAccount.current_balance + amount;
    if (newBalance > creditAccount.credit_limit) {
      toast.error(`Limite de crédit dépassée (${creditAccount.credit_limit}€)`);
      return;
    }

    // Appeler onApply qui va déclencher le paiement et la création de la transaction
    onApply(amount);
  };

  const availableCredit = creditAccount 
    ? creditAccount.credit_limit - creditAccount.current_balance 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Crédit Client - {customerName}
          </DialogTitle>
        </DialogHeader>

        {!creditAccount ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="flex-1">
                <p className="font-medium">Aucun compte crédit</p>
                <p className="text-sm text-muted-foreground">Ce client n'a pas encore de compte crédit</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Limite de crédit (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="500.00"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Montant maximum que le client peut devoir
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateAccount}
                disabled={!creditLimit || createAccount.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer le compte
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Crédit utilisé</p>
                <p className="text-2xl font-bold">{creditAccount.current_balance.toFixed(2)}€</p>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Crédit disponible</p>
                <p className="text-2xl font-bold text-green-500">{availableCredit.toFixed(2)}€</p>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Limite totale:</span>
                <span className="font-bold">{creditAccount.credit_limit.toFixed(2)}€</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Montant de la vente:</span>
                <span className="font-bold text-blue-500">{totalAmount.toFixed(2)}€</span>
              </div>
            </div>

            {availableCredit < totalAmount && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Crédit insuffisant</p>
                  <p className="text-xs text-muted-foreground">
                    Le client ne peut pas mettre ce montant à crédit
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Montant à mettre à crédit (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={Math.min(availableCredit, totalAmount)}
                value={amountToCharge}
                onChange={(e) => setAmountToCharge(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum: {Math.min(availableCredit, totalAmount).toFixed(2)}€
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCharge}
                disabled={
                  !amountToCharge || 
                  parseFloat(amountToCharge) <= 0 || 
                  parseFloat(amountToCharge) > Math.min(availableCredit, totalAmount) ||
                  chargeCredit.isPending
                }
              >
                <Wallet className="h-4 w-4 mr-2" />
                Valider le crédit
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
