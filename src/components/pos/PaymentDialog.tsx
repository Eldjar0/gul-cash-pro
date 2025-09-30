import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, Smartphone, Banknote, Calculator } from 'lucide-react';
import { NumericKeypad } from './NumericKeypad';

type PaymentMethod = 'cash' | 'card' | 'mobile';

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
          <div className="grid grid-cols-3 gap-6 py-8">
            <Button
              size="lg"
              onClick={() => setMethod('cash')}
              className="h-40 flex flex-col gap-4 bg-gradient-to-br from-category-green to-primary text-white hover:scale-105 transition-all shadow-2xl hover:shadow-3xl border-0"
            >
              <Banknote className="h-16 w-16" />
              <span className="text-xl font-bold">💵 Espèces</span>
            </Button>
            <Button
              size="lg"
              onClick={() => setMethod('card')}
              className="h-40 flex flex-col gap-4 bg-gradient-to-br from-category-blue to-secondary text-white hover:scale-105 transition-all shadow-2xl hover:shadow-3xl border-0"
            >
              <CreditCard className="h-16 w-16" />
              <span className="text-xl font-bold">💳 Carte</span>
            </Button>
            <Button
              size="lg"
              onClick={() => setMethod('mobile')}
              className="h-40 flex flex-col gap-4 bg-gradient-to-br from-category-purple to-accent text-white hover:scale-105 transition-all shadow-2xl hover:shadow-3xl border-0"
            >
              <Smartphone className="h-16 w-16" />
              <span className="text-xl font-bold">📱 Mobile</span>
            </Button>
          </div>
        ) : method === 'cash' ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-pos-display to-secondary p-8 rounded-2xl shadow-2xl border-2 border-primary/30">
              <div className="text-sm text-white/80 mb-2 font-semibold">💰 Montant reçu</div>
              <div className="text-5xl font-black text-white mb-6 tracking-tight">
                {amountPaid || '0.00'}€
              </div>
              {amountPaid && parseFloat(amountPaid) >= total && (
                <div className="text-3xl font-bold text-pos-success bg-white/20 px-4 py-3 rounded-xl backdrop-blur-sm animate-pulse-soft">
                  ✅ À rendre: {getChange().toFixed(2)}€
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-3">
              {suggestedAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setAmountPaid(amount.toFixed(2))}
                  className="h-14 bg-gradient-to-br from-category-teal to-pos-info text-white hover:scale-105 transition-all font-bold shadow-lg border-0"
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
