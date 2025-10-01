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

  const quickAmounts = [5, 10, 20, 50, 100, 200];
  const suggestedAmounts = quickAmounts.filter(amount => amount >= total);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#0a0a0a] border-2 border-pos-success/30">
        <DialogHeader>
          <DialogTitle className="text-pos-success font-mono text-2xl">MODE DE PAIEMENT</DialogTitle>
          <p className="text-white text-3xl font-bold font-mono mt-2">TOTAL: {total.toFixed(2)}€</p>
        </DialogHeader>

        {!method ? (
          <div className="grid grid-cols-3 gap-4 py-6">
            <Card
              onClick={() => setMethod('cash')}
              className="h-48 cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] border-4 border-category-green hover:border-pos-success transition-all"
            >
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <Banknote className="h-20 w-20 text-category-green" />
                <span className="text-white font-bold text-xl font-mono">ESPÈCES</span>
              </div>
            </Card>

            <Card
              onClick={() => setMethod('card')}
              className="h-48 cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] border-4 border-category-blue hover:border-pos-success transition-all"
            >
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <CreditCard className="h-20 w-20 text-category-blue" />
                <span className="text-white font-bold text-xl font-mono">CARTE</span>
              </div>
            </Card>

            <Card
              onClick={() => setMethod('mobile')}
              className="h-48 cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] border-4 border-category-purple hover:border-pos-success transition-all"
            >
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <Smartphone className="h-20 w-20 text-category-purple" />
                <span className="text-white font-bold text-xl font-mono">SANS CONTACT</span>
              </div>
            </Card>
          </div>
        ) : method === 'cash' ? (
          <div className="space-y-4">
            <Card className="bg-[#1a1a1a] border-2 border-pos-success/30 p-6">
              <p className="text-gray-400 text-sm mb-2 font-mono">MONTANT REÇU</p>
              <div className="text-pos-success text-5xl font-bold font-mono mb-4">
                {amountPaid || '0.00'}€
              </div>
              {amountPaid && parseFloat(amountPaid) >= total && (
                <Card className="bg-pos-success/20 border-pos-success p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-10 w-10 text-pos-success" />
                    <div>
                      <p className="text-white font-bold text-lg font-mono">RENDU DE MONNAIE</p>
                      <p className="text-pos-success text-4xl font-bold font-mono">{getChange().toFixed(2)}€</p>
                    </div>
                  </div>
                </Card>
              )}
            </Card>

            {suggestedAmounts.length > 0 && (
              <div className="grid grid-cols-6 gap-2">
                {suggestedAmounts.map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => setAmountPaid(amount.toFixed(2))}
                    className="h-14 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-2 border-pos-success/30 hover:border-pos-success font-bold font-mono text-lg"
                  >
                    {amount}€
                  </Button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'C'].map((key) => (
                <Button
                  key={key}
                  onClick={() => handleNumberClick(key)}
                  className="h-16 text-2xl font-bold bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-2 border-[#444] font-mono"
                >
                  {key}
                </Button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleBack} 
                className="flex-1 h-14 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-2 border-[#444] font-mono"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                RETOUR
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!amountPaid || parseFloat(amountPaid) < total}
                className="flex-1 h-14 bg-pos-success hover:bg-pos-success/90 text-black font-bold text-lg disabled:opacity-50 font-mono"
              >
                VALIDER
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            <Card className="p-8 text-center bg-[#1a1a1a] border-2 border-pos-success/30">
              <div className="animate-pulse">
                {method === 'card' ? (
                  <CreditCard className="h-24 w-24 mx-auto mb-4 text-category-blue" />
                ) : (
                  <Smartphone className="h-24 w-24 mx-auto mb-4 text-category-purple" />
                )}
              </div>
              <p className="text-white text-xl font-bold mb-2 font-mono">
                {method === 'card' ? 'INSÉRER LA CARTE' : 'APPROCHER LE TÉLÉPHONE'}
              </p>
              <p className="text-gray-400 font-mono">En attente du paiement...</p>
            </Card>

            <div className="flex gap-3">
              <Button 
                onClick={handleBack} 
                className="flex-1 h-14 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-2 border-[#444] font-mono"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                RETOUR
              </Button>
              <Button 
                onClick={handleConfirm} 
                className="flex-1 h-14 bg-pos-success hover:bg-pos-success/90 text-black font-bold text-lg font-mono"
              >
                VALIDER PAIEMENT
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
