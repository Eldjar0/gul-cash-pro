import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGiftCard, useCreateGiftCard } from '@/hooks/useGiftCards';
import { Gift, CreditCard, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { printGiftCardReceipt } from '@/components/pos/GiftCardReceipt';

interface GiftCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onApply: (amount: number, cardId: string, cardNumber: string) => void;
}

export const GiftCardDialog = ({ open, onOpenChange, totalAmount, onApply }: GiftCardDialogProps) => {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [amountToUse, setAmountToUse] = useState('');
  const [verifiedCard, setVerifiedCard] = useState<any>(null);
  
  // Pour la création
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardBalance, setNewCardBalance] = useState('');
  const [newCardType] = useState<'gift_card'>('gift_card');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');

  const { refetch: fetchCard } = useGiftCard(cardNumber);
  const createCard = useCreateGiftCard();

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

  const handleCreate = () => {
    const balance = parseFloat(newCardBalance);
    
    if (!newCardNumber || balance <= 0) {
      toast.error('Remplissez tous les champs');
      return;
    }

    createCard.mutate({
      card_number: newCardNumber,
      card_type: newCardType,
      initial_balance: balance,
      sender_name: senderName,
      message: message,
    }, {
      onSuccess: (data) => {
        toast.success('Carte créée avec succès');
        
        // Imprimer le ticket avec redirection après impression
        printGiftCardReceipt(data, senderName, message, () => {
          // Fermer le dialogue
          onOpenChange(false);
          
          // Rediriger vers la page Paiements
          setTimeout(() => {
            navigate('/payments');
          }, 500);
        });
        
        // Réinitialiser les champs
        setNewCardNumber('');
        setNewCardBalance('');
        setSenderName('');
        setMessage('');
      }
    });
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Carte Cadeau / Ticket Restaurant
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="use" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="use">Utiliser</TabsTrigger>
            <TabsTrigger value="create">Créer</TabsTrigger>
          </TabsList>

          <TabsContent value="use" className="space-y-4 mt-4">
            <DialogDescription>
              Scannez ou entrez le numéro de la carte
            </DialogDescription>

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
          </TabsContent>

          <TabsContent value="create" className="space-y-4 mt-4">
              <DialogDescription>
                Créer une nouvelle carte cadeau
              </DialogDescription>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Numéro de carte</Label>
                <Input
                  placeholder="Ex: GC-001"
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Montant initial (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="50.00"
                  value={newCardBalance}
                  onChange={(e) => setNewCardBalance(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Nom de l'offrant (optionnel)</Label>
                <Input
                  placeholder="Jean Dupont"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Message personnalisé (optionnel)</Label>
                <Textarea
                  placeholder="Joyeux anniversaire ! Profitez bien..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!newCardNumber || !newCardBalance || createCard.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer et Imprimer
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
