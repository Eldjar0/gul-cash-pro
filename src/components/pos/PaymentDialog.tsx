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
import { CreditCard, Smartphone, Banknote, ArrowLeft, CheckCircle, HandCoins, Wallet, Gift, Receipt as ReceiptIcon, Split } from 'lucide-react';

type PaymentMethod = 'cash' | 'card' | 'mobile' | 'gift_card' | 'customer_credit' | 'check' | 'mixed';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirmPayment: (method: PaymentMethod, amountPaid?: number, metadata?: any) => void;
  onMixedPayment?: () => void;
  customerId?: string;
}

export function PaymentDialog({ open, onOpenChange, total, onConfirmPayment, onMixedPayment, customerId }: PaymentDialogProps) {
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
          <div className="space-y-6">
            {/* Primary payment methods */}
            <div className="grid grid-cols-3 gap-4">
              <Card
                onClick={() => setMethod('cash')}
                className="h-40 cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] border-4 border-category-green hover:border-pos-success transition-all"
              >
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <Banknote className="h-16 w-16 text-category-green" />
                  <span className="text-white font-bold text-lg font-mono">ESPÈCES</span>
                </div>
              </Card>

              <Card
                onClick={() => setMethod('card')}
                className="h-40 cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] border-4 border-category-blue hover:border-pos-success transition-all"
              >
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <CreditCard className="h-16 w-16 text-category-blue" />
                  <span className="text-white font-bold text-lg font-mono">CARTE</span>
                </div>
              </Card>

              <Card
                onClick={() => setMethod('mobile')}
                className="h-40 cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] border-4 border-category-purple hover:border-pos-success transition-all"
              >
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <Smartphone className="h-16 w-16 text-category-purple" />
                  <span className="text-white font-bold text-lg font-mono">SANS CONTACT</span>
                </div>
              </Card>
            </div>

            {/* Secondary payment methods */}
            <div className="grid grid-cols-4 gap-3">
              <Card
                onClick={() => setMethod('gift_card')}
                className="h-32 cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] border-2 border-pink-500/30 hover:border-pink-500 transition-all"
              >
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Gift className="h-12 w-12 text-pink-500" />
                  <span className="text-white font-bold text-sm font-mono">CARTE CADEAU</span>
                </div>
              </Card>

              <Card
                onClick={() => setMethod('check')}
                className="h-32 cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] border-2 border-orange-500/30 hover:border-orange-500 transition-all"
              >
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <ReceiptIcon className="h-12 w-12 text-orange-500" />
                  <span className="text-white font-bold text-sm font-mono">CHÈQUE</span>
                </div>
              </Card>

              <Card
                onClick={() => customerId && setMethod('customer_credit')}
                className={`h-32 bg-[#1a1a1a] border-2 border-cyan-500/30 transition-all ${
                  customerId 
                    ? 'cursor-pointer hover:bg-[#2a2a2a] hover:border-cyan-500' 
                    : 'cursor-not-allowed opacity-50'
                }`}
              >
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Wallet className="h-12 w-12 text-cyan-500" />
                  <span className="text-white font-bold text-sm font-mono text-center">CRÉDIT CLIENT</span>
                  {!customerId && <span className="text-xs text-gray-500">Client requis</span>}
                </div>
              </Card>

              <Card
                onClick={() => {
                  if (onMixedPayment) {
                    onOpenChange(false);
                    onMixedPayment();
                  }
                }}
                className="h-32 cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] border-2 border-yellow-500/30 hover:border-yellow-500 transition-all"
              >
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Split className="h-12 w-12 text-yellow-500" />
                  <span className="text-white font-bold text-sm font-mono">PAIEMENT MIXTE</span>
                </div>
              </Card>
            </div>
          </div>
        ) : method === 'cash' ? (
          <div className="space-y-6">
            {/* MONTANT À PAYER */}
            <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border-4 border-white/20 p-6">
              <div className="flex items-center gap-4 mb-3">
                <Wallet className="h-10 w-10 text-white" />
                <p className="text-white/80 text-2xl font-bold font-mono">MONTANT À PAYER</p>
              </div>
              <div className="text-white text-7xl font-black font-mono text-center py-4">
                {total.toFixed(2)}€
              </div>
            </Card>

            {/* MONTANT REÇU DU CLIENT */}
            <Card className="bg-gradient-to-br from-pos-success/30 to-pos-success/10 border-4 border-pos-success p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-pos-success/5 animate-pulse"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <HandCoins className="h-12 w-12 text-pos-success animate-bounce" />
                  <p className="text-white text-3xl font-bold font-mono">MONTANT REÇU</p>
                </div>
                <div className="text-pos-success text-8xl font-black font-mono text-center py-6 drop-shadow-lg">
                  {amountPaid || '0.00'}€
                </div>
              </div>
            </Card>

            {/* RENDU DE MONNAIE */}
            {amountPaid && parseFloat(amountPaid) >= total && (
              <Card className="bg-gradient-to-br from-category-green/30 to-category-green/10 border-4 border-category-green p-8 animate-scale-in">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-16 w-16 text-category-green animate-pulse" />
                    <div>
                      <p className="text-white font-bold text-3xl font-mono mb-2">RENDU DE MONNAIE</p>
                      <Badge className="bg-category-green text-black text-xl px-4 py-2 font-mono font-black">
                        À REMETTRE AU CLIENT
                      </Badge>
                    </div>
                  </div>
                  <div className="text-category-green text-7xl font-black font-mono animate-pulse">
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
        ) : method === 'gift_card' || method === 'check' || method === 'customer_credit' ? (
          <div className="space-y-6 py-6">
            <Card className="p-8 text-center bg-[#1a1a1a] border-2 border-pos-success/30">
              <div className="animate-pulse mb-4">
                {method === 'gift_card' && <Gift className="h-24 w-24 mx-auto text-pink-500" />}
                {method === 'check' && <ReceiptIcon className="h-24 w-24 mx-auto text-orange-500" />}
                {method === 'customer_credit' && <Wallet className="h-24 w-24 mx-auto text-cyan-500" />}
              </div>
              <p className="text-white text-xl font-bold mb-2 font-mono">
                {method === 'gift_card' && 'SAISIR N° CARTE CADEAU'}
                {method === 'check' && 'VALIDER LE CHÈQUE'}
                {method === 'customer_credit' && 'CRÉDIT CLIENT'}
              </p>
              <p className="text-gray-400 font-mono">
                {method === 'gift_card' && 'Scanner ou saisir le numéro...'}
                {method === 'check' && 'Montant: ' + total.toFixed(2) + '€'}
                {method === 'customer_credit' && 'Utiliser le crédit disponible'}
              </p>
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
