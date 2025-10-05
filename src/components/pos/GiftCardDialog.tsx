import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGiftCards, useGiftCard, useCreateGiftCard, useUseGiftCard } from '@/hooks/useGiftCards';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/hooks/useAuth';
import { useCreateSale } from '@/hooks/useSales';
import { Gift, CreditCard, Plus, Search, Printer, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { printGiftCardReceipt } from '@/components/pos/GiftCardReceipt';

interface GiftCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GiftCardDialog = ({ open, onOpenChange }: GiftCardDialogProps) => {
  const { user } = useAuth();
  const { data: giftCards } = useGiftCards();
  const { data: customers } = useCustomers();
  const createGiftCard = useCreateGiftCard();
  const createSale = useCreateSale();
  
  // État pour l'onglet "Utiliser"
  const [cardNumber, setCardNumber] = useState('');
  const [verifiedCard, setVerifiedCard] = useState<any>(null);
  const { refetch: fetchCard } = useGiftCard(cardNumber);
  
  // État pour l'onglet "Vendre"
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardBalance, setNewCardBalance] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  
  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState('');

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
    toast.success(`Carte vérifiée: ${data.current_balance.toFixed(2)}€ disponible`);
  };

  const handleSellGiftCard = async () => {
    const balance = parseFloat(newCardBalance);
    
    if (!newCardNumber || balance <= 0) {
      toast.error('Remplissez tous les champs');
      return;
    }

    if (!user) {
      toast.error('Connectez-vous pour vendre');
      return;
    }

    try {
      // 1. Créer la carte cadeau
      const newCard = await createGiftCard.mutateAsync({
        card_number: newCardNumber,
        card_type: 'gift_card',
        initial_balance: balance,
        sender_name: senderName,
        message: message,
      });

      // 2. Créer une vente pour la carte cadeau
      const saleData = {
        subtotal: balance,
        total_vat: 0, // Pas de TVA sur les cartes cadeaux généralement
        total_discount: 0,
        total: balance,
        payment_method: 'card' as const, // Le client paie la carte cadeau
        amount_paid: balance,
        change_amount: 0,
        is_invoice: false,
        is_cancelled: false,
        cashier_id: user.id,
        items: [{
          product_name: `Carte Cadeau ${newCardNumber}`,
          product_barcode: newCardNumber,
          quantity: 1,
          unit_price: balance,
          vat_rate: 0,
          subtotal: balance,
          vat_amount: 0,
          total: balance
        }]
      };

      await createSale.mutateAsync(saleData);

      toast.success('Carte cadeau vendue avec succès');
      
      // Imprimer le ticket de la carte cadeau
      printGiftCardReceipt(newCard, senderName, message);
      
      // Réinitialiser les champs
      setNewCardNumber('');
      setNewCardBalance('');
      setSenderName('');
      setMessage('');
    } catch (error) {
      console.error('Error selling gift card:', error);
      toast.error('Erreur lors de la vente');
    }
  };

  const handleReset = () => {
    setCardNumber('');
    setVerifiedCard(null);
  };

  const filteredCards = giftCards?.filter(card => 
    card.card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customers?.find(c => c.id === card.customer_id)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleReset();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Cartes Cadeaux
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="use" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="use">Utiliser</TabsTrigger>
            <TabsTrigger value="sell">Vendre</TabsTrigger>
            <TabsTrigger value="manage">Gérer</TabsTrigger>
          </TabsList>

          {/* Onglet UTILISER */}
          <TabsContent value="use" className="space-y-4 mt-4">
            <DialogDescription>
              Scannez ou entrez le numéro de la carte pour vérifier le solde
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
                {verifiedCard && (
                  <Button variant="outline" onClick={handleReset}>
                    Autre carte
                  </Button>
                )}
              </div>
            </div>

            {verifiedCard && (
              <div className="p-4 bg-muted rounded-lg space-y-3 border-2 border-primary">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="font-medium">Carte Cadeau</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Solde disponible:</span>
                  <span className="font-bold text-2xl text-primary">{verifiedCard.current_balance.toFixed(2)} €</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date émission:</span>
                  <span className="font-medium">{format(new Date(verifiedCard.issued_date), 'dd/MM/yyyy')}</span>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1"
                    onClick={() => printGiftCardReceipt(verifiedCard)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Réimprimer
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Onglet VENDRE */}
          <TabsContent value="sell" className="space-y-4 mt-4">
            <DialogDescription>
              Créer une nouvelle carte cadeau (sera enregistrée comme une vente)
            </DialogDescription>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Numéro de carte *</Label>
                <Input
                  placeholder="Ex: GC-2025-001"
                  value={newCardNumber}
                  onChange={(e) => setNewCardNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Montant (€) *</Label>
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

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Info:</strong> La vente de cette carte cadeau sera enregistrée comme un ticket de caisse.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSellGiftCard}
                disabled={!newCardNumber || !newCardBalance || createGiftCard.isPending || createSale.isPending}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Vendre et Imprimer
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Onglet GÉRER */}
          <TabsContent value="manage" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une carte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                {filteredCards && filteredCards.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Solde initial</TableHead>
                        <TableHead>Solde actuel</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCards.map((card) => {
                        const customer = customers?.find(c => c.id === card.customer_id);
                        return (
                          <TableRow key={card.id}>
                            <TableCell className="font-mono text-xs">{card.card_number}</TableCell>
                            <TableCell className="text-xs">{customer?.name || '-'}</TableCell>
                            <TableCell className="text-xs">{card.initial_balance.toFixed(2)} €</TableCell>
                            <TableCell className="font-bold text-xs">{card.current_balance.toFixed(2)} €</TableCell>
                            <TableCell className="text-xs">
                              {format(new Date(card.issued_date), 'dd/MM/yy')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={card.is_active && card.current_balance > 0 ? 'default' : 'secondary'} className="text-xs">
                                {card.is_active && card.current_balance > 0 ? 'Active' : 'Épuisée'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={card.current_balance <= 0}
                                onClick={() => printGiftCardReceipt(card)}
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Aucune carte trouvée
                  </div>
                )}
              </ScrollArea>

              <div className="text-sm text-muted-foreground text-center">
                Total: {giftCards?.length || 0} carte(s)
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
