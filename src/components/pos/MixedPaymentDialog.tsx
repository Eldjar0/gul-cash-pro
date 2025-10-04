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
import { CreditCard, Smartphone, Banknote, Gift, Receipt as ReceiptIcon, Wallet, Trash2, Plus, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PaymentMethodType = 'cash' | 'card' | 'mobile' | 'gift_card' | 'check' | 'customer_credit';

interface PaymentSplit {
  method: PaymentMethodType;
  amount: number;
}

interface MixedPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirmPayment: (splits: PaymentSplit[]) => void;
  customerId?: string;
}

const paymentMethods = [
  { value: 'cash' as const, label: 'Espèces', icon: Banknote, color: 'text-category-green' },
  { value: 'card' as const, label: 'Carte', icon: CreditCard, color: 'text-category-blue' },
  { value: 'mobile' as const, label: 'Sans contact', icon: Smartphone, color: 'text-category-purple' },
  { value: 'gift_card' as const, label: 'Carte cadeau', icon: Gift, color: 'text-pink-500' },
  { value: 'check' as const, label: 'Chèque', icon: ReceiptIcon, color: 'text-orange-500' },
  { value: 'customer_credit' as const, label: 'Crédit client', icon: Wallet, color: 'text-cyan-500' },
];

export function MixedPaymentDialog({ open, onOpenChange, total, onConfirmPayment, customerId }: MixedPaymentDialogProps) {
  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('cash');
  const [amount, setAmount] = useState('');

  const totalPaid = splits.reduce((sum, split) => sum + split.amount, 0);
  const remaining = Math.max(0, total - totalPaid);
  const isComplete = remaining === 0;

  const addSplit = () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return;
    
    if (totalPaid + amountNum > total) {
      return;
    }

    setSplits([...splits, { method: selectedMethod, amount: amountNum }]);
    setAmount('');
  };

  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (isComplete) {
      onConfirmPayment(splits);
      setSplits([]);
      setAmount('');
    }
  };

  const getMethodInfo = (method: PaymentMethodType) => {
    return paymentMethods.find(m => m.value === method);
  };

  const quickAmounts = [10, 20, 50, 100].filter(amt => amt <= remaining);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#0a0a0a] border-2 border-pos-success/30">
        <DialogHeader>
          <DialogTitle className="text-pos-success font-mono text-2xl">PAIEMENT MIXTE</DialogTitle>
          <p className="text-white text-3xl font-bold font-mono mt-2">TOTAL: {total.toFixed(2)}€</p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Payment splits */}
          <div className="space-y-4">
            <Card className="bg-[#1a1a1a] border-2 border-white/20 p-4">
              <h3 className="text-white font-bold font-mono mb-3">RÉPARTITION</h3>
              {splits.length === 0 ? (
                <p className="text-gray-500 text-center py-6 font-mono">Aucun paiement ajouté</p>
              ) : (
                <div className="space-y-2">
                  {splits.map((split, index) => {
                    const info = getMethodInfo(split.method);
                    const Icon = info?.icon;
                    return (
                      <div key={index} className="flex items-center justify-between bg-[#2a2a2a] p-3 rounded">
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className={`h-5 w-5 ${info?.color}`} />}
                          <span className="text-white font-mono">{info?.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold font-mono">{split.amount.toFixed(2)}€</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSplit(index)}
                            className="h-8 w-8 p-0 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Summary */}
            <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border-2 border-white/20 p-4">
              <div className="space-y-2 text-white font-mono">
                <div className="flex justify-between">
                  <span>Total à payer:</span>
                  <span className="font-bold">{total.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Déjà payé:</span>
                  <span className="font-bold text-pos-success">{totalPaid.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-white/20">
                  <span>Restant:</span>
                  <span className={`font-bold ${remaining === 0 ? 'text-pos-success' : 'text-yellow-500'}`}>
                    {remaining.toFixed(2)}€
                  </span>
                </div>
              </div>
            </Card>

            {isComplete && (
              <Card className="bg-gradient-to-br from-pos-success/30 to-pos-success/10 border-2 border-pos-success p-4 animate-scale-in">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-10 w-10 text-pos-success animate-pulse" />
                  <div>
                    <p className="text-white font-bold font-mono">PAIEMENT COMPLET</p>
                    <Badge className="bg-pos-success text-black font-mono mt-1">
                      Cliquer sur VALIDER
                    </Badge>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right: Add payment */}
          <div className="space-y-4">
            <Card className="bg-[#1a1a1a] border-2 border-white/20 p-4">
              <h3 className="text-white font-bold font-mono mb-3">AJOUTER UN PAIEMENT</h3>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-white font-mono">Méthode</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {paymentMethods
                      .filter(m => m.value !== 'customer_credit' || customerId)
                      .map((method) => {
                        const Icon = method.icon;
                        return (
                          <Button
                            key={method.value}
                            onClick={() => setSelectedMethod(method.value)}
                            className={`h-20 ${
                              selectedMethod === method.value
                                ? 'bg-[#3a3a3a] border-2 border-pos-success'
                                : 'bg-[#2a2a2a] border-2 border-[#444]'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <Icon className={`h-6 w-6 ${method.color}`} />
                              <span className="text-xs text-white font-mono">{method.label}</span>
                            </div>
                          </Button>
                        );
                      })}
                  </div>
                </div>

                <div>
                  <Label className="text-white font-mono">Montant</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-[#2a2a2a] border-2 border-[#444] text-white text-2xl font-mono h-14 text-center"
                    step="0.01"
                    max={remaining}
                  />
                </div>

                {quickAmounts.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((amt) => (
                      <Button
                        key={amt}
                        onClick={() => setAmount(amt.toString())}
                        className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border border-[#444] font-mono"
                      >
                        {amt}€
                      </Button>
                    ))}
                  </div>
                )}

                <Button
                  onClick={addSplit}
                  disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > remaining}
                  className="w-full h-12 bg-pos-success hover:bg-pos-success/90 text-black font-bold font-mono"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  AJOUTER
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => {
              setSplits([]);
              setAmount('');
              onOpenChange(false);
            }}
            className="flex-1 h-14 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border-2 border-[#444] font-mono"
          >
            ANNULER
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isComplete}
            className="flex-1 h-14 bg-pos-success hover:bg-pos-success/90 text-black font-bold text-lg disabled:opacity-50 font-mono"
          >
            VALIDER PAIEMENT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
