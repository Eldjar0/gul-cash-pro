import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGiftCards, useCreateGiftCard } from '@/hooks/useGiftCards';
import { useCustomers } from '@/hooks/useCustomers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function GiftCardsManagement() {
  const { data: giftCards, isLoading } = useGiftCards();
  const { data: customers } = useCustomers();
  const createGiftCard = useCreateGiftCard();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    card_number: '',
    card_type: 'gift_card' as const,
    initial_balance: '',
    customer_id: '',
    expiry_date: '',
  });

  const handleCreate = async () => {
    if (!formData.card_number || !formData.initial_balance) {
      toast.error('Numéro et montant requis');
      return;
    }

    try {
      await createGiftCard.mutateAsync({
        card_number: formData.card_number,
        card_type: formData.card_type,
        initial_balance: parseFloat(formData.initial_balance),
        current_balance: parseFloat(formData.initial_balance),
        customer_id: formData.customer_id || null,
        expiry_date: formData.expiry_date || null,
        is_active: true,
      });

      setFormData({
        card_number: '',
        card_type: 'gift_card',
        initial_balance: '',
        customer_id: '',
        expiry_date: '',
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating gift card:', error);
    }
  };

  const filteredCards = giftCards?.filter(card => 
    card.card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customers?.find(c => c.id === card.customer_id)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une carte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Émettre une carte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle Carte Cadeau</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Numéro de carte *</Label>
                <Input
                  value={formData.card_number}
                  onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                  placeholder="Ex: GC-2025-0001"
                />
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  value={formData.card_type}
                  onValueChange={(value: any) => setFormData({ ...formData, card_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gift_card">Carte Cadeau</SelectItem>
                    <SelectItem value="store_credit">Avoir Magasin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Montant initial (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                  placeholder="50.00"
                />
              </div>

              <div>
                <Label>Client (optionnel)</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date d'expiration (optionnel)</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={createGiftCard.isPending}>
                <Gift className="h-4 w-4 mr-2" />
                Créer la carte
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cartes Émises</CardTitle>
          <CardDescription>
            {giftCards?.length || 0} carte(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Chargement...</div>
          ) : filteredCards && filteredCards.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Solde initial</TableHead>
                  <TableHead>Solde actuel</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCards.map((card) => {
                  const customer = customers?.find(c => c.id === card.customer_id);
                  return (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono">{card.card_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {card.card_type === 'gift_card' ? 'Cadeau' : 'Avoir'}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer?.name || '-'}</TableCell>
                      <TableCell>{card.initial_balance.toFixed(2)} €</TableCell>
                      <TableCell className="font-bold">{card.current_balance.toFixed(2)} €</TableCell>
                      <TableCell>
                        {card.expiry_date ? format(new Date(card.expiry_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={card.is_active ? 'default' : 'secondary'}>
                          {card.is_active ? 'Active' : 'Inactive'}
                        </Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}
