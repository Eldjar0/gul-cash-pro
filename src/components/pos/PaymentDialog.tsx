import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, Banknote, Calculator } from 'lucide-react';
import { PaymentMethod } from '@/types/pos';
import { NumericKeypad } from './NumericKeypad';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirmPayment: (method: PaymentMethod, amountPaid?: number) => void;
}

export function PaymentDialog({ open, onOpenChange, total, onConfirmPayment }: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [amountPaid, setAmountPaid] = useState('');

  const handleNumberClick = (num: string) => {
    setAmountPaid((prev) => prev + num);
  };

  const handleClear = () => {
    setAmountPaid('');
  };

  const handleBackspace = () => {
    setAmountPaid((prev) => prev.slice(0, -1));
  };

  const getChange = () => {
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, paid - total);
  };

  const getRoundedAmount = (amount: number) => {
    return Math.ceil(amount * 20) / 20; // Arrondir à 0.05€
  };

  const handleConfirm = () => {
    if (method) {
      const paid = parseFloat(amountPaid) || total;
      onConfirmPayment(method, method === 'cash' ? paid : undefined);
      setMethod(null);
      setAmountPaid('');
    }
  };

  const suggestedAmounts = [
    total,
    getRoundedAmount(total),
    Math.ceil(total),
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Paiement - {total.toFixed(2)}€</DialogTitle>
        </DialogHeader>

        {!method ? (
          <div className="grid grid-cols-3 gap-4 py-6">
            <Button
              size="lg"
              onClick={() => setMethod('cash')}
              className="h-32 flex flex-col gap-3 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Banknote className="h-12 w-12" />
              <span className="text-lg font-semibold">Espèces</span>
            </Button>
            <Button
              size="lg"
              onClick={() => setMethod('card')}
              className="h-32 flex flex-col gap-3 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              <CreditCard className="h-12 w-12" />
              <span className="text-lg font-semibold">Carte</span>
            </Button>
            <Button
              size="lg"
              onClick={() => setMethod('mobile')}
              className="h-32 flex flex-col gap-3 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Smartphone className="h-12 w-12" />
              <span className="text-lg font-semibold">Mobile</span>
            </Button>
          </div>
        ) : method === 'cash' ? (
          <div className="space-y-4">
            <div className="bg-pos-display p-6 rounded-lg">
              <div className="text-sm text-pos-display-foreground mb-2">Montant reçu</div>
              <div className="text-4xl font-bold text-pos-display-foreground mb-4">
                {amountPaid || '0.00'}€
              </div>
              {amountPaid && parseFloat(amountPaid) >= total && (
                <div className="text-2xl font-bold text-pos-success">
                  À rendre: {getChange().toFixed(2)}€
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {suggestedAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setAmountPaid(amount.toFixed(2))}
                  className="h-12 bg-pos-info text-primary-foreground hover:bg-pos-info/90"
                >
                  {amount.toFixed(2)}€
                </Button>
              ))}
            </div>

            <NumericKeypad
              onNumberClick={handleNumberClick}
              onClear={handleClear}
              onBackspace={handleBackspace}
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMethod(null)} className="flex-1">
                Retour
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!amountPaid || parseFloat(amountPaid) < total}
                className="flex-1 bg-pos-success text-primary-foreground hover:bg-pos-success/90"
              >
                Valider
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-6">
            <div className="text-center text-lg text-muted-foreground">
              {method === 'card' ? 'Insérez ou présentez la carte' : 'Présentez le téléphone'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMethod(null)} className="flex-1">
                Retour
              </Button>
              <Button onClick={handleConfirm} className="flex-1 bg-pos-success text-primary-foreground hover:bg-pos-success/90">
                Paiement effectué
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
