import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderItem {
  product_id: string;
  product_name: string;
  product_barcode?: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  subtotal: number;
  vat_amount: number;
  total: number;
}

interface CreateCustomerOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateCustomerOrderDialog = ({ open, onOpenChange, onSuccess }: CreateCustomerOrderDialogProps) => {
  const { toast } = useToast();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  
  const [customerId, setCustomerId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [depositPaid, setDepositPaid] = useState('0');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = () => {
    const product = products?.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseFloat(quantity) || 1;
    const unitPrice = product.price;
    const vatRate = product.vat_rate;
    const subtotal = qty * unitPrice;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    const newItem: OrderItem = {
      product_id: product.id,
      product_name: product.name,
      product_barcode: product.barcode || undefined,
      quantity: qty,
      unit_price: unitPrice,
      vat_rate: vatRate,
      subtotal,
      vat_amount: vatAmount,
      total
    };

    setItems([...items, newItem]);
    setSelectedProductId('');
    setQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = items.reduce((sum, item) => sum + item.vat_amount, 0);
    const total = subtotal + totalVat;
    return { subtotal, totalVat, total };
  };

  const handleSubmit = async () => {
    if (!customerId) {
      toast({ title: "Client requis", description: "Veuillez sélectionner un client", variant: "destructive" });
      return;
    }

    if (items.length === 0) {
      toast({ title: "Articles requis", description: "Ajoutez au moins un article", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { subtotal, totalVat, total } = calculateTotals();
      const deposit = parseFloat(depositPaid) || 0;
      const remaining = total - deposit;

      // Get next order number
      const { data: lastOrder } = await supabase
        .from('customer_orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastOrder?.order_number) {
        const match = lastOrder.order_number.match(/CMD(\d+)/);
        if (match) nextNumber = parseInt(match[1]) + 1;
      }
      const orderNumber = `CMD${nextNumber.toString().padStart(6, '0')}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('customer_orders')
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          subtotal,
          total_vat: totalVat,
          total,
          deposit_paid: deposit,
          remaining_balance: remaining,
          status: 'pending',
          notes
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const { error: itemsError } = await supabase
        .from('customer_order_items')
        .insert(
          items.map(item => ({
            customer_order_id: order.id,
            ...item
          }))
        );

      if (itemsError) throw itemsError;

      toast({ title: "Commande créée", description: `Commande ${orderNumber} créée avec succès` });
      
      // Reset form
      setCustomerId('');
      setNotes('');
      setDepositPaid('0');
      setItems([]);
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de créer la commande", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Nouvelle Commande Client</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Items */}
            <div className="space-y-4">
              <Label>Articles</Label>
              <div className="flex gap-2">
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.filter(p => p.is_active).map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.price.toFixed(2)} €
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Qté"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-24"
                  min="0.01"
                  step="0.01"
                />
                <Button onClick={handleAddItem} disabled={!selectedProductId}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="border rounded-lg">
                  <div className="grid grid-cols-12 gap-2 p-2 bg-muted font-semibold text-sm">
                    <div className="col-span-4">Produit</div>
                    <div className="col-span-2 text-right">Qté</div>
                    <div className="col-span-2 text-right">Prix U.</div>
                    <div className="col-span-2 text-right">TVA</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-2 border-t items-center text-sm">
                      <div className="col-span-4">{item.product_name}</div>
                      <div className="col-span-2 text-right">{item.quantity}</div>
                      <div className="col-span-2 text-right">{item.unit_price.toFixed(2)} €</div>
                      <div className="col-span-2 text-right">{item.vat_amount.toFixed(2)} €</div>
                      <div className="col-span-2 text-right flex items-center justify-between">
                        <span>{item.total.toFixed(2)} €</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            {items.length > 0 && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>Sous-total HT:</span>
                  <span className="font-semibold">{totals.subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA:</span>
                  <span className="font-semibold">{totals.totalVat.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC:</span>
                  <span>{totals.total.toFixed(2)} €</span>
                </div>
              </div>
            )}

            {/* Deposit */}
            <div className="space-y-2">
              <Label>Acompte versé</Label>
              <Input
                type="number"
                value={depositPaid}
                onChange={(e) => setDepositPaid(e.target.value)}
                min="0"
                step="0.01"
              />
              {parseFloat(depositPaid) > 0 && (
                <p className="text-sm text-muted-foreground">
                  Reste à payer: {(totals.total - parseFloat(depositPaid)).toFixed(2)} €
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarques sur la commande..."
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 border-t pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || items.length === 0}>
            {isSubmitting ? 'Création...' : 'Créer la commande'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
