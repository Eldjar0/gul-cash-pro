import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Undo2, AlertCircle, Search, Calendar } from 'lucide-react';
import { useCreateRefund } from '@/hooks/useRefunds';
import { useSales } from '@/hooks/useSales';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectedItem {
  index: number;
  quantity: number;
}

export function RefundDialog({ open, onOpenChange }: RefundDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Record<number, SelectedItem>>({});
  const [reason, setReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');

  const { data: recentSales = [] } = useSales();
  const createRefund = useCreateRefund();

  const filteredSales = recentSales
    .filter(sale => !sale.is_cancelled)
    .filter(sale => {
      const matchesSearch = 
        sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = !searchDate || 
        format(new Date(sale.date), 'yyyy-MM-dd') === searchDate;
      
      return matchesSearch && matchesDate;
    })
    .slice(0, 20);

  const handleToggleItem = (index: number, maxQuantity: number) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      if (newItems[index]) {
        delete newItems[index];
      } else {
        newItems[index] = { index, quantity: maxQuantity };
      }
      return newItems;
    });
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: { ...prev[index], quantity: Math.max(0, quantity) }
    }));
  };

  const getTotalRefund = () => {
    if (!selectedSale) return 0;
    return Object.values(selectedItems).reduce((sum, item) => {
      const saleItem = selectedSale.sale_items[item.index];
      const unitPrice = saleItem.total / saleItem.quantity;
      return sum + (unitPrice * item.quantity);
    }, 0);
  };

  const handleCreateRefund = async () => {
    if (!selectedSale || Object.keys(selectedItems).length === 0 || !reason.trim()) return;

    const itemsToRefund = Object.values(selectedItems).map(item => {
      const saleItem = selectedSale.sale_items[item.index];
      const ratio = item.quantity / saleItem.quantity;
      
      return {
        product_id: saleItem.product_id,
        product_name: saleItem.product_name,
        product_barcode: saleItem.product_barcode,
        quantity: item.quantity,
        unit_price: saleItem.unit_price,
        vat_rate: saleItem.vat_rate,
        subtotal: saleItem.subtotal * ratio,
        vat_amount: saleItem.vat_amount * ratio,
        total: saleItem.total * ratio,
      };
    });

    const totalRefund = getTotalRefund();
    const refundRatio = totalRefund / selectedSale.total;

    const refundData = {
      original_sale_id: selectedSale.id,
      customer_id: selectedSale.customer_id,
      reason: reason.trim(),
      refund_type: Object.keys(selectedItems).length === selectedSale.sale_items.length ? 'full' : 'partial' as 'full' | 'partial',
      subtotal: selectedSale.subtotal * refundRatio,
      total_vat: selectedSale.total_vat * refundRatio,
      total: totalRefund,
      payment_method: paymentMethod,
      items: itemsToRefund,
    };

    await createRefund.mutateAsync(refundData);
    
    // Reset form
    setSelectedSale(null);
    setSelectedItems({});
    setSearchTerm('');
    setSearchDate('');
    setReason('');
    setPaymentMethod('cash');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            Créer un Remboursement
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Recherche de vente */}
            {!selectedSale && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Numéro de ticket ou nom client</Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Ex: 20250105-0001 ou Jean Dupont"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Date (optionnel)</Label>
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredSales.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm || searchDate ? 'Aucune vente trouvée' : 'Saisissez un numéro de ticket ou un nom client'}
                    </div>
                  ) : (
                    filteredSales.map((sale) => (
                      <Card
                        key={sale.id}
                        className="p-3 cursor-pointer hover:shadow-md hover:border-primary transition-all"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{sale.sale_number}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(sale.date), 'dd MMM yyyy HH:mm', { locale: fr })}
                              {sale.customers && ` • ${sale.customers.name}`}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {sale.sale_items?.length || 0} article(s)
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{sale.total.toFixed(2)}€</div>
                            <Badge variant="outline" className="mt-1">
                              {sale.payment_method === 'cash' ? 'Espèces' : 
                               sale.payment_method === 'card' ? 'CB' : 
                               sale.payment_method === 'mobile' ? 'Virement' : 
                               sale.payment_method}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Sélection des articles à rembourser */}
            {selectedSale && (
              <div className="space-y-4">
                <Card className="p-4 bg-muted/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedSale.sale_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedSale.date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                      {selectedSale.customers && (
                        <p className="text-sm text-muted-foreground">Client: {selectedSale.customers.name}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedSale(null);
                        setSelectedItems({});
                      }}
                    >
                      Changer
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Sélectionnez les articles à rembourser :</Label>
                    {selectedSale.sale_items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                        <Checkbox
                          checked={!!selectedItems[idx]}
                          onCheckedChange={() => handleToggleItem(idx, item.quantity)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.unit_price.toFixed(2)}€ × {item.quantity}
                          </div>
                        </div>
                        {selectedItems[idx] && (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Qté:</Label>
                            <Input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={selectedItems[idx].quantity}
                              onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value))}
                              className="w-20"
                            />
                          </div>
                        )}
                        <div className="text-right font-bold">
                          {selectedItems[idx] 
                            ? ((item.total / item.quantity) * selectedItems[idx].quantity).toFixed(2)
                            : item.total.toFixed(2)}€
                        </div>
                      </div>
                    )) || <div className="text-center py-4 text-muted-foreground">Aucun article</div>}
                    
                    <div className="pt-3 border-t flex justify-between items-center">
                      <span className="font-bold text-lg">Total à rembourser:</span>
                      <span className="font-bold text-2xl text-primary">{getTotalRefund().toFixed(2)}€</span>
                    </div>
                  </div>
                </Card>

                <div>
                  <Label>Méthode de remboursement</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <Button
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('cash')}
                      className="h-16"
                    >
                      Espèces
                    </Button>
                    <Button
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className="h-16"
                    >
                      CB
                    </Button>
                    <Button
                      variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('mobile')}
                      className="h-16"
                    >
                      Virement
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Raison du remboursement *</Label>
                  <Textarea
                    placeholder="Expliquez la raison du remboursement..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <Card className="p-4 bg-destructive/10 border-destructive/30">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-destructive mb-1">Important</p>
                      <p className="text-muted-foreground">
                        Le remboursement remettra les produits en stock et créera une <strong>perte</strong> dans les rapports X et Z.
                        Cette action est irréversible.
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSale(null);
                      setSelectedItems({});
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateRefund}
                    disabled={Object.keys(selectedItems).length === 0 || !reason.trim() || createRefund.isPending}
                    className="flex-1"
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Créer le remboursement ({getTotalRefund().toFixed(2)}€)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
