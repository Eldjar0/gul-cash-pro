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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone, Banknote, ArrowLeft, CheckCircle, HandCoins, Wallet, Split, X, FileText } from 'lucide-react';

type PaymentMethod = 'cash' | 'card' | 'mobile' | 'customer_credit';

interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirmPayment: (method: PaymentMethod, amountPaid?: number, metadata?: any) => void;
  onMixedPayment?: () => void;
  onOpenCustomerCreditDialog?: () => void;
  customerId?: string;
  onConvertToInvoice?: (method: PaymentMethod, amountPaid?: number) => void;
}

export function PaymentDialog({ 
  open, 
  onOpenChange, 
  total, 
  onConfirmPayment, 
  onMixedPayment,
  onOpenCustomerCreditDialog,
  customerId,
  onConvertToInvoice
}: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [isMixedMode, setIsMixedMode] = useState(false);
  const [convertToInvoice, setConvertToInvoice] = useState(false);
  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [splitAmount, setSplitAmount] = useState('');

  const handleNumberClick = (num: string) => {
    if (num === 'C') {
      setAmountPaid('');
    } else {
      setAmountPaid((prev) => prev + num);
    }
  };

  const getCashChange = () => {
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, paid - total);
  };

  const handleConfirm = () => {
    if (method) {
      const paid = parseFloat(amountPaid) || total;
      
      if (convertToInvoice && onConvertToInvoice && customerId) {
        // Convertir en facture
        onConvertToInvoice(method, method === 'cash' ? paid : undefined);
      } else {
        // Paiement normal
        onConfirmPayment(method, method === 'cash' ? paid : undefined);
      }
      
      setMethod(null);
      setAmountPaid('');
      setConvertToInvoice(false);
    }
  };

  const handleBack = () => {
    if (isMixedMode) {
      setIsMixedMode(false);
      setSplits([]);
      setSplitAmount('');
    } else {
      setMethod(null);
      setAmountPaid('');
    }
  };

  const handleCancel = () => {
    setMethod(null);
    setAmountPaid('');
    setIsMixedMode(false);
    setSplits([]);
    setSplitAmount('');
    onOpenChange(false);
  };

  const getTotalPaid = () => splits.reduce((sum, split) => sum + split.amount, 0);
  const getRemaining = () => total - getTotalPaid();
  const getChange = () => Math.max(0, getTotalPaid() - total);

  const addSplit = () => {
    const amount = parseFloat(splitAmount);
    if (!amount || amount <= 0) return;
    
    const remaining = getRemaining();
    const finalAmount = Math.min(amount, remaining);
    
    if (finalAmount > 0) {
      setSplits([...splits, { method: selectedMethod, amount: finalAmount }]);
      setSplitAmount('');
    }
  };

  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleConfirmMixed = () => {
    if (getTotalPaid() >= total) {
      onConfirmPayment('cash', undefined, { splits, change: getChange() });
      handleCancel();
    }
  };

  const getMethodInfo = (methodType: PaymentMethod) => {
    const methods = {
      cash: { label: 'Espèces', icon: Banknote, color: 'text-green-500' },
      card: { label: 'CB', icon: CreditCard, color: 'text-blue-500' },
      mobile: { label: 'Virement', icon: Smartphone, color: 'text-purple-500' },
      customer_credit: { label: 'Crédit', icon: Wallet, color: 'text-cyan-500' },
    };
    return methods[methodType];
  };

  const quickAmounts = [5, 10, 20, 50, 100, 200];
  const suggestedAmounts = quickAmounts.filter(amount => amount >= total);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-background to-muted/50 border-2 !mt-0 !top-24">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Mode de Paiement</DialogTitle>
          <p className="text-3xl font-bold mt-2">Total: {total.toFixed(2)}€</p>
        </DialogHeader>

        {!method && !isMixedMode ? (
          <div className="space-y-4">
            {/* Option de conversion en facture */}
            {customerId && onConvertToInvoice && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <Label htmlFor="convert-invoice" className="font-semibold text-blue-900">
                        Générer une facture
                      </Label>
                      <p className="text-xs text-blue-700">
                        Cette vente sera transformée en facture pour le client
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="convert-invoice"
                    checked={convertToInvoice}
                    onCheckedChange={setConvertToInvoice}
                  />
                </div>
              </Card>
            )}

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
            <div className="grid grid-cols-2 gap-3">
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
                onClick={() => setIsMixedMode(true)}
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
        ) : isMixedMode ? (
          <div className="space-y-4">
            {/* Total and Remaining */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-muted/50 border-2 p-4">
                <p className="text-sm font-semibold mb-1">Total à payer</p>
                <p className="text-3xl font-black">{total.toFixed(2)}€</p>
              </Card>
              <Card className={`border-2 p-4 ${getRemaining() > 0 ? 'bg-orange-500/10 border-orange-500' : 'bg-green-500/10 border-green-500'}`}>
                <p className="text-sm font-semibold mb-1">
                  {getRemaining() > 0 ? 'Reste à payer' : getChange() > 0 ? 'À rendre' : 'Payé'}
                </p>
                <p className={`text-3xl font-black ${getRemaining() > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                  {getRemaining() > 0 ? getRemaining().toFixed(2) : getChange().toFixed(2)}€
                </p>
              </Card>
            </div>

            {/* Payment splits list */}
            {splits.length > 0 && (
              <Card className="p-4 space-y-2">
                <p className="font-bold mb-2">Paiements enregistrés</p>
                {splits.map((split, index) => {
                  const methodInfo = getMethodInfo(split.method);
                  const Icon = methodInfo.icon;
                  return (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${methodInfo.color}`} />
                        <span className="font-semibold">{methodInfo.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">{split.amount.toFixed(2)}€</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSplit(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}

            {/* Add payment */}
            {getRemaining() > 0 && (
              <Card className="p-4 space-y-3">
                <p className="font-bold">Ajouter un paiement</p>
                
                <div className="grid grid-cols-4 gap-2">
                  {(['cash', 'card', 'mobile', 'customer_credit'] as PaymentMethod[]).map((m) => {
                    const methodInfo = getMethodInfo(m);
                    const Icon = methodInfo.icon;
                    return (
                      <Button
                        key={m}
                        variant={selectedMethod === m ? 'default' : 'outline'}
                        onClick={() => setSelectedMethod(m)}
                        className="h-20 flex-col gap-1"
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs">{methodInfo.label}</span>
                      </Button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Montant"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    className="text-lg"
                  />
                  <Button onClick={addSplit} className="whitespace-nowrap">
                    Ajouter
                  </Button>
                </div>
              </Card>
            )}

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
                onClick={handleConfirmMixed}
                disabled={getRemaining() > 0}
                className="flex-1 h-12 font-bold text-lg"
              >
                Valider
              </Button>
            </div>
          </div>
        ) : method === 'cash' ? (
          <div className="space-y-2">
            {/* MONTANT À PAYER */}
            <Card className="bg-muted/50 border-2 p-2">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-5 w-5" />
                <p className="text-base font-bold">Montant à payer</p>
              </div>
              <div className="text-3xl font-black text-center py-1">
                {total.toFixed(2)}€
              </div>
            </Card>

            {/* MONTANT REÇU DU CLIENT */}
            <Card className="bg-green-500/10 border-2 border-green-500 p-2">
              <div className="flex items-center gap-2 mb-1">
                <HandCoins className="h-5 w-5 text-green-500" />
                <p className="text-base font-bold">Montant reçu</p>
              </div>
              <div className="text-3xl font-black text-center py-1 text-green-500">
                {amountPaid || '0.00'}€
              </div>
            </Card>

            {/* RENDU DE MONNAIE */}
            {amountPaid && parseFloat(amountPaid) >= total && (
              <Card className="bg-blue-500/10 border-2 border-blue-500 p-2 animate-in">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-bold text-base">Rendu de monnaie</p>
                      <Badge className="bg-blue-500 text-white text-xs">À remettre au client</Badge>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-blue-500">
                    {getCashChange().toFixed(2)}€
                  </div>
                </div>
              </Card>
            )}

            {suggestedAmounts.length > 0 && (
              <div className="grid grid-cols-6 gap-1">
                {suggestedAmounts.map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => setAmountPaid(amount.toFixed(2))}
                    variant="outline"
                    className="h-9 text-sm font-bold"
                  >
                    {amount}€
                  </Button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-1">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'C'].map((key) => (
                <Button
                  key={key}
                  onClick={() => handleNumberClick(key)}
                  variant="outline"
                  className="h-11 text-lg font-bold"
                >
                  {key}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleBack} 
                variant="outline"
                className="flex-1 h-10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!amountPaid || parseFloat(amountPaid) < total}
                className="flex-1 h-10 font-bold text-base"
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
