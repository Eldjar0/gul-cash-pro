import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Banknote, ArrowLeft, CheckCircle, HandCoins, Wallet, Split } from 'lucide-react';

type PaymentMethod = 'cash' | 'card' | 'mobile' | 'gift_card' | 'customer_credit';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirmPayment: (method: PaymentMethod, amountPaid?: number, metadata?: any) => void;
  onMixedPayment?: () => void;
  onOpenGiftCardDialog?: () => void;
  onOpenCustomerCreditDialog?: () => void;
  customerId?: string;
}

export function PaymentDialog({ 
  open, 
  onOpenChange, 
  total, 
  onConfirmPayment, 
  onMixedPayment,
  onOpenGiftCardDialog,
  onOpenCustomerCreditDialog,
  customerId 
}: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [amountPaid, setAmountPaid] = useState('');

  const handleNumberClick = (num: string) => {
    if (num === 'C') {
      setAmountPaid('');
    } else {
      setAmountPaid((prev) => prev + num);
    }
  };

  const getChange = () => {
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, paid - total);
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

  const handleCancel = () => {
    setMethod(null);
    setAmountPaid('');
    onOpenChange(false);
  };

  const quickAmounts = [5, 10, 20, 50, 100, 200];
  const suggestedAmounts = quickAmounts.filter(amount => amount >= total);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-background to-muted/50 border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Mode de Paiement</DialogTitle>
          <p className="text-3xl font-bold mt-2">Total: {total.toFixed(2)}€</p>
        </DialogHeader>

        {!method ? (
          <div className="space-y-4">
            {/* Primary payment methods */}
            <div className="grid grid-cols-3 gap-3">
              <Card
                onClick={() => setMethod('cash')}
                className="h-28 cursor-pointer hover:scale-105 transition-transform border-2 hover:border-primary"
              >
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Banknote className="h-10 w-10 text-green-500" />
                  <span className="font-bold">Espèces</span>
                </div>
              </Card>

              <Card
                onClick={() => setMethod('card')}
                className="h-28 cursor-pointer hover:scale-105 transition-transform border-2 hover:border-primary"
              >
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <CreditCard className="h-10 w-10 text-blue-500" />
                  <span className="font-bold">CB</span>
                </div>
              </Card>

              <Card
                onClick={() => setMethod('mobile')}
                className="h-28 cursor-pointer hover:scale-105 transition-transform border-2 hover:border-primary"
              >
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Smartphone className="h-10 w-10 text-purple-500" />
                  <span className="font-bold">Virement</span>
                </div>
              </Card>
            </div>

            {/* Secondary payment methods */}
            <div className="grid grid-cols-3 gap-3">
              <Card
                onClick={() => {
                  onOpenChange(false);
                  if (onOpenGiftCardDialog) onOpenGiftCardDialog();
                }}
                className="h-24 cursor-pointer hover:scale-105 transition-transform border-2 hover:border-primary"
              >
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Wallet className="h-8 w-8 text-pink-500" />
                  <span className="font-bold text-sm">Carte Cadeau</span>
                </div>
              </Card>

              <Card
                onClick={() => {
                  if (customerId) {
                    onOpenChange(false);
                    if (onOpenCustomerCreditDialog) onOpenCustomerCreditDialog();
                  }
                }}
                className={`h-24 border-2 transition-transform ${
                  customerId 
                    ? 'cursor-pointer hover:scale-105 hover:border-primary' 
                    : 'cursor-not-allowed opacity-50'
                }`}
              >
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Wallet className="h-8 w-8 text-cyan-500" />
                  <span className="font-bold text-sm text-center">Crédit Client</span>
                  {!customerId && <span className="text-xs text-muted-foreground">Client requis</span>}
                </div>
              </Card>

              <Card
                onClick={() => {
                  if (onMixedPayment) {
                    onOpenChange(false);
                    onMixedPayment();
                  }
                }}
                className="h-24 cursor-pointer hover:scale-105 transition-transform border-2 hover:border-primary"
              >
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Split className="h-8 w-8 text-yellow-500" />
                  <span className="font-bold text-sm">Paiement Mixte</span>
                </div>
              </Card>
            </div>

            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full h-12 font-bold"
            >
              Annuler
            </Button>
          </div>
        ) : method === 'cash' ? (
          <div className="space-y-4">
            {/* MONTANT À PAYER */}
            <Card className="bg-muted/50 border-2 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="h-8 w-8" />
                <p className="text-xl font-bold">Montant à payer</p>
              </div>
              <div className="text-5xl font-black text-center py-3">
                {total.toFixed(2)}€
              </div>
            </Card>

            {/* MONTANT REÇU DU CLIENT */}
            <Card className="bg-green-500/10 border-2 border-green-500 p-4">
              <div className="flex items-center gap-3 mb-2">
                <HandCoins className="h-8 w-8 text-green-500" />
                <p className="text-xl font-bold">Montant reçu</p>
              </div>
              <div className="text-5xl font-black text-center py-3 text-green-500">
                {amountPaid || '0.00'}€
              </div>
            </Card>

            {/* RENDU DE MONNAIE */}
            {amountPaid && parseFloat(amountPaid) >= total && (
              <Card className="bg-blue-500/10 border-2 border-blue-500 p-4 animate-in">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-bold text-xl">Rendu de monnaie</p>
                      <Badge className="bg-blue-500 text-white mt-1">À remettre au client</Badge>
                    </div>
                  </div>
                  <div className="text-5xl font-black text-blue-500">
                    {getChange().toFixed(2)}€
                  </div>
                </div>
              </Card>
            )}

            {suggestedAmounts.length > 0 && (
              <div className="grid grid-cols-6 gap-2">
                {suggestedAmounts.map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => setAmountPaid(amount.toFixed(2))}
                    variant="outline"
                    className="h-12 font-bold"
                  >
                    {amount}€
                  </Button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'C'].map((key) => (
                <Button
                  key={key}
                  onClick={() => handleNumberClick(key)}
                  variant="outline"
                  className="h-14 text-xl font-bold"
                >
                  {key}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleBack} 
                variant="outline"
                className="flex-1 h-12"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!amountPaid || parseFloat(amountPaid) < total}
                className="flex-1 h-12 font-bold text-lg"
              >
                Valider
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Card className="p-6 text-center bg-muted/50 border-2">
              <div className="animate-pulse mb-3">
                {method === 'card' ? (
                  <CreditCard className="h-20 w-20 mx-auto text-blue-500" />
                ) : (
                  <Smartphone className="h-20 w-20 mx-auto text-purple-500" />
                )}
              </div>
              <p className="text-xl font-bold mb-2">
                {method === 'card' ? 'LE CLIENT A PAYÉ PAR CB ?' : 'VIREMENT EFFECTUÉ ?'}
              </p>
              <p className="text-muted-foreground">Confirmez que le paiement est validé</p>
            </Card>

            <div className="flex gap-2">
              <Button 
                onClick={handleBack} 
                variant="outline"
                className="flex-1 h-12"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button 
                onClick={handleConfirm} 
                className="flex-1 h-12 font-bold text-lg"
              >
                Valider Paiement
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
