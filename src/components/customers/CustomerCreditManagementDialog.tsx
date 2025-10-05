import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerCreditAccount, usePayCredit, useUpdateCreditLimit, useChargeCredit } from '@/hooks/useCustomerCredit';
import { Euro, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

interface CustomerCreditManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
}

export function CustomerCreditManagementDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
}: CustomerCreditManagementDialogProps) {
  const { data: creditAccount, isLoading } = useCustomerCreditAccount(customerId);
  const payCredit = usePayCredit();
  const updateLimit = useUpdateCreditLimit();
  const chargeCredit = useChargeCredit();

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  const handlePayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      return;
    }

    if (!creditAccount || amount > creditAccount.current_balance) {
      return;
    }

    try {
      await payCredit.mutateAsync({
        customerId,
        amount,
        notes: paymentNotes || 'Remboursement de crédit',
      });
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUpdateLimit = async () => {
    const limit = parseFloat(newLimit);
    if (!limit || limit < 0) {
      return;
    }

    try {
      await updateLimit.mutateAsync({
        customerId,
        newLimit: limit,
      });
      setNewLimit('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleFullPayment = () => {
    if (creditAccount) {
      setPaymentAmount(creditAccount.current_balance.toString());
    }
  };

  const handleAddDebt = async () => {
    const amount = parseFloat(debtAmount);
    if (!amount || amount <= 0) {
      return;
    }

    if (!creditAccount) {
      return;
    }

    const newBalance = creditAccount.current_balance + amount;
    if (newBalance > creditAccount.credit_limit) {
      return;
    }

    try {
      await chargeCredit.mutateAsync({
        customerId,
        amount,
        notes: debtNotes || 'Ajout manuel de dette',
      });
      setDebtAmount('');
      setDebtNotes('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestion Crédit - {customerName}</DialogTitle>
        </DialogHeader>

        {creditAccount && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Solde actuel</p>
              <p className="text-2xl font-bold text-destructive">
                {creditAccount.current_balance.toFixed(2)}€
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disponible</p>
              <p className="text-2xl font-bold text-success">
                {(creditAccount.credit_limit - creditAccount.current_balance).toFixed(2)}€
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Limite totale</p>
              <p className="text-2xl font-bold">
                {creditAccount.credit_limit.toFixed(2)}€
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payment">
              <Receipt className="w-4 h-4 mr-2" />
              Remboursement
            </TabsTrigger>
            <TabsTrigger value="add">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ajouter dette
            </TabsTrigger>
            <TabsTrigger value="limit">
              <Euro className="w-4 h-4 mr-2" />
              Limite
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant à rembourser</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={creditAccount?.current_balance || 0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
                <Button
                  variant="outline"
                  onClick={handleFullPayment}
                  disabled={!creditAccount?.current_balance}
                >
                  Solde complet
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Maximum: {creditAccount?.current_balance.toFixed(2) || '0.00'}€
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Ex: Remboursement espèces, ticket de caisse..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                onClick={handlePayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || payCredit.isPending}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Enregistrer le remboursement
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="debtAmount">Montant à ajouter</Label>
              <Input
                id="debtAmount"
                type="number"
                step="0.01"
                min="0"
                max={creditAccount ? creditAccount.credit_limit - creditAccount.current_balance : 0}
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-sm text-muted-foreground">
                Maximum disponible: {creditAccount ? (creditAccount.credit_limit - creditAccount.current_balance).toFixed(2) : '0.00'}€
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="debtNotes">Raison (optionnel)</Label>
              <Textarea
                id="debtNotes"
                value={debtNotes}
                onChange={(e) => setDebtNotes(e.target.value)}
                placeholder="Ex: Achat externe, ajustement manuel..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                onClick={handleAddDebt}
                disabled={!debtAmount || parseFloat(debtAmount) <= 0 || chargeCredit.isPending}
                variant="destructive"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Ajouter la dette
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="limit" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newLimit">Nouvelle limite de crédit</Label>
              <Input
                id="newLimit"
                type="number"
                step="50"
                min="0"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder={creditAccount?.credit_limit.toFixed(2) || '0.00'}
              />
              <p className="text-sm text-muted-foreground">
                Limite actuelle: {creditAccount?.credit_limit.toFixed(2) || '0.00'}€
              </p>
            </div>

            {newLimit && parseFloat(newLimit) !== creditAccount?.credit_limit && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {parseFloat(newLimit) > (creditAccount?.credit_limit || 0) ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-orange-600" />
                  )}
                  <span className="font-semibold">
                    {parseFloat(newLimit) > (creditAccount?.credit_limit || 0)
                      ? 'Augmentation'
                      : 'Diminution'}{' '}
                    de la limite
                  </span>
                </div>
                <p className="text-sm">
                  {creditAccount?.credit_limit.toFixed(2)}€ → {parseFloat(newLimit).toFixed(2)}€
                  <br />
                  Différence:{' '}
                  {Math.abs(parseFloat(newLimit) - (creditAccount?.credit_limit || 0)).toFixed(2)}€
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={handleUpdateLimit}
                disabled={!newLimit || parseFloat(newLimit) < 0 || updateLimit.isPending}
              >
                <Euro className="w-4 h-4 mr-2" />
                Mettre à jour la limite
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
