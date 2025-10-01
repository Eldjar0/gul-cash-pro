import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, Smartphone, Banknote, ArrowLeft, CheckCircle } from 'lucide-react';
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
    return Math.ceil(amount * 20) / 20;
  };

  const handleConfirm = () => {
    if (method) {
      const paid = parseFloat(amountPaid) || total;
      onConfirmPayment(method, method === 'cash' ? paid : undefined);
      setMethod(null);
      setAmountPaid('');
    }
  };

  const handleBack = () => {
    setMethod(null);
    setAmountPaid('');
  };

  const suggestedAmounts = [
    total,
    getRoundedAmount(total),
    Math.ceil(total),
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass border-2 border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Paiement
          </DialogTitle>
          <p className="text-3xl font-black mt-2">{total.toFixed(2)}€</p>
        </DialogHeader>

        {!method ? (
          <div className="grid grid-cols-3 gap-4 py-6">
            <Card
              onClick={() => setMethod('cash')}
              className="relative h-40 cursor-pointer group overflow-hidden border-2 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-glow-lg bg-gradient-to-br from-pos-success to-category-green"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative h-full flex flex-col items-center justify-center gap-4">
                <Banknote className="h-16 w-16 text-white drop-shadow-lg" />
                <span className="text-white font-bold text-lg drop-shadow-md">Espèces</span>
              </div>
            </Card>

            <Card
              onClick={() => setMethod('card')}
              className="relative h-40 cursor-pointer group overflow-hidden border-2 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-glow-lg bg-gradient-to-br from-primary to-secondary"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative h-full flex flex-col items-center justify-center gap-4">
                <CreditCard className="h-16 w-16 text-white drop-shadow-lg" />
                <span className="text-white font-bold text-lg drop-shadow-md">Carte</span>
              </div>
            </Card>

            <Card
              onClick={() => setMethod('mobile')}
              className="relative h-40 cursor-pointer group overflow-hidden border-2 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-glow-lg bg-gradient-to-br from-secondary to-category-purple"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative h-full flex flex-col items-center justify-center gap-4">
                <Smartphone className="h-16 w-16 text-white drop-shadow-lg" />
                <span className="text-white font-bold text-lg drop-shadow-md">Mobile</span>
              </div>
            </Card>
          </div>
        ) : method === 'cash' ? (
          <div className="space-y-6 animate-fade-in">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--gradient-display)]"></div>
              <div className="relative p-6">
                <p className="text-sm text-white/70 mb-2 font-medium">Montant reçu</p>
                <div className="text-5xl font-black text-white mb-4 tracking-tight">
                  {amountPaid || '0.00'}€
                </div>
                {amountPaid && parseFloat(amountPaid) >= total && (
                  <Card className="bg-pos-success/20 border-pos-success/30 p-4 animate-bounce-in">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-pos-success" />
                      <div>
                        <p className="text-white font-bold text-lg">Rendu de monnaie</p>
                        <p className="text-pos-success text-3xl font-black">{getChange().toFixed(2)}€</p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </Card>

            {suggestedAmounts.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {suggestedAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setAmountPaid(amount.toFixed(2))}
                    className="h-12 bg-gradient-to-br from-accent to-accent/80 text-white border-0 hover:scale-105 active:scale-95 transition-all font-bold shadow-lg"
                  >
                    {amount.toFixed(2)}€
                  </Button>
                ))}
              </div>
            )}

            <NumericKeypad
              onNumberClick={handleNumberClick}
              onClear={handleClear}
              onBackspace={handleBackspace}
            />

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="flex-1 h-14 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!amountPaid || parseFloat(amountPaid) < total}
                className="flex-1 h-14 bg-gradient-to-r from-pos-success to-category-green text-white hover:scale-105 transition-all font-bold text-lg shadow-lg disabled:opacity-50 disabled:hover:scale-100"
              >
                Valider
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-6 animate-fade-in">
            <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
              <div className="animate-pulse-soft">
                {method === 'card' ? (
                  <CreditCard className="h-20 w-20 mx-auto mb-4 text-primary" />
                ) : (
                  <Smartphone className="h-20 w-20 mx-auto mb-4 text-secondary" />
                )}
              </div>
              <p className="text-lg text-foreground font-medium">
                {method === 'card' 
                  ? 'Insérez ou présentez la carte bancaire' 
                  : 'Présentez le téléphone sur le terminal'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">En attente du paiement...</p>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="flex-1 h-14 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button 
                onClick={handleConfirm} 
                className="flex-1 h-14 bg-gradient-to-r from-pos-success to-category-green text-white hover:scale-105 transition-all font-bold text-lg shadow-lg"
              >
                Paiement effectué
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
