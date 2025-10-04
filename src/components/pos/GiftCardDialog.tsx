import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGiftCard, useUseGiftCard } from '@/hooks/useGiftCards';
import { Gift, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface GiftCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onApply: (amount: number, cardId: string, cardNumber: string) => void;
}

export const GiftCardDialog = ({ open, onOpenChange, totalAmount, onApply }: GiftCardDialogProps) => {
  const [cardNumber, setCardNumber] = useState('');
  const [amountToUse, setAmountToUse] = useState('');
  const [verifiedCard, setVerifiedCard] = useState<any>(null);

  const { refetch: fetchCard } = useGiftCard(cardNumber);
  const useCard = useUseGiftCard();

  const handleVerify = async () => {
    if (!cardNumber) {
      toast.error('Entrez un numéro de carte');
      return;
    }

    const { data, error } = await fetchCard();
    
    if (error || !data) {
      toast.error('Carte non trouvée');
      return;
    }

    if (!data.is_active) {
      toast.error('Carte désactivée');
      return;
    }

    if (data.current_balance <= 0) {
      toast.error('Carte vide');
      return;
    }

    setVerifiedCard(data);
    setAmountToUse(Math.min(data.current_balance, totalAmount).toFixed(2));
  };

  const handleApply = () => {
    const amount = parseFloat(amountToUse);
    
    if (!verifiedCard || amount <= 0 || amount > verifiedCard.current_balance) {
      toast.error('Montant invalide');
      return;
    }

    if (amount > totalAmount) {
      toast.error('Montant supérieur au total');
      return;
    }

    onApply(amount, verifiedCard.id, verifiedCard.card_number);
    handleReset();
  };

  const handleReset = () => {
    setCardNumber('');
    setAmountToUse('');
    setVerifiedCard(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleReset();
      onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Carte Cadeau / Ticket Restaurant
          </DialogTitle>
          <DialogDescription>
            Scannez ou entrez le numéro de la carte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Numéro de Carte</Label>
            <div className="flex gap-2">
              <Input
                placeholder="GC-XXX ou scan code-barres"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                disabled={!!verifiedCard}
              />
              <Button onClick={handleVerify} disabled={!!verifiedCard}>
                Vérifier
              </Button>
            </div>
          </div>

          {verifiedCard && (
            <>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="font-medium">
                    {verifiedCard.card_type === 'gift_card' ? 'Carte Cadeau' : 'Ticket Restaurant'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Solde disponible:</span>
                  <span className="font-bold text-lg">{verifiedCard.current_balance.toFixed(2)} €</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Montant à payer:</span>
                  <span className="font-medium">{totalAmount.toFixed(2)} €</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Montant à utiliser</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={Math.min(verifiedCard.current_balance, totalAmount)}
                  value={amountToUse}
                  onChange={(e) => setAmountToUse(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: {Math.min(verifiedCard.current_balance, totalAmount).toFixed(2)} €
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          {verifiedCard && (
            <Button onClick={handleApply}>
              <CreditCard className="h-4 w-4 mr-2" />
              Appliquer {amountToUse} €
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
