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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone, Banknote, Plus, Trash2, Check } from 'lucide-react';

interface PaymentPart {
  method: 'cash' | 'card' | 'mobile';
  amount: number;
}

interface MixedPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirmPayment: (payments: PaymentPart[]) => void;
}

export function MixedPaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirmPayment,
}: MixedPaymentDialogProps) {
  const [payments, setPayments] = useState<PaymentPart[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [amount, setAmount] = useState('');

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);
  const isComplete = totalPaid >= total;

  const handleAddPayment = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    if (totalPaid + amountNum > total) {
      // Ne pas dépasser le total
      const maxAmount = total - totalPaid;
      setPayments([...payments, { method: selectedMethod, amount: maxAmount }]);
    } else {
      setPayments([...payments, { method: selectedMethod, amount: amountNum }]);
    }
    setAmount('');
  };

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (isComplete) {
      onConfirmPayment(payments);
      setPayments([]);
      setAmount('');
    }
  };

  const handleReset = () => {
    setPayments([]);
    setAmount('');
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Espèces';
      case 'card':
        return 'Carte';
      case 'mobile':
        return 'Mobile';
      default:
        return method;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Paiement Mixte</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Montant total et restant */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-primary/10">
              <p className="text-sm text-muted-foreground mb-1">Montant total</p>
              <p className="text-2xl font-bold">{total.toFixed(2)}€</p>
            </Card>
            <Card className={`p-4 ${isComplete ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
              <p className="text-sm text-muted-foreground mb-1">Restant à payer</p>
              <p className="text-2xl font-bold">{remaining.toFixed(2)}€</p>
            </Card>
          </div>

          {/* Paiements ajoutés */}
          {payments.length > 0 && (
            <div>
              <Label className="mb-2 block">Paiements enregistrés</Label>
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <Card key={index} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getMethodIcon(payment.method)}
                      <div>
                        <p className="font-medium">{getMethodLabel(payment.method)}</p>
                        <p className="text-sm text-muted-foreground">{payment.amount.toFixed(2)}€</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemovePayment(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Ajouter un paiement */}
          {!isComplete && (
            <div className="space-y-4">
              <Label>Ajouter un mode de paiement</Label>
              
              <div className="grid grid-cols-3 gap-3">
                <Card
                  onClick={() => setSelectedMethod('cash')}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedMethod === 'cash'
                      ? 'ring-2 ring-primary bg-primary/10'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Banknote className="h-8 w-8" />
                    <span className="text-sm font-medium">Espèces</span>
                  </div>
                </Card>

                <Card
                  onClick={() => setSelectedMethod('card')}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedMethod === 'card'
                      ? 'ring-2 ring-primary bg-primary/10'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className="h-8 w-8" />
                    <span className="text-sm font-medium">Carte</span>
                  </div>
                </Card>

                <Card
                  onClick={() => setSelectedMethod('mobile')}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedMethod === 'mobile'
                      ? 'ring-2 ring-primary bg-primary/10'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Smartphone className="h-8 w-8" />
                    <span className="text-sm font-medium">Mobile</span>
                  </div>
                </Card>
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Montant..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPayment()}
                />
                <Button onClick={handleAddPayment} disabled={!amount || parseFloat(amount) <= 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Réinitialiser
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isComplete}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Valider le paiement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}