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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Undo2, AlertCircle, Search } from 'lucide-react';
import { useCreateRefund } from '@/hooks/useRefunds';
import { useSales } from '@/hooks/useSales';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RefundDialog({ open, onOpenChange }: RefundDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [reason, setReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');

  const { data: recentSales = [] } = useSales();
  const createRefund = useCreateRefund();

  const filteredSales = recentSales
    .filter(sale => !sale.is_cancelled)
    .filter(sale =>
      sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 10);

  const handleCreateRefund = async () => {
    if (!selectedSale || !reason.trim()) return;

    const refundData = {
      original_sale_id: selectedSale.id,
      customer_id: selectedSale.customer_id,
      reason: reason.trim(),
      refund_type: refundType,
      subtotal: selectedSale.subtotal,
      total_vat: selectedSale.total_vat,
      total: selectedSale.total,
      payment_method: paymentMethod,
      items: selectedSale.sale_items.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_barcode: item.product_barcode,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        subtotal: item.subtotal,
        vat_amount: item.vat_amount,
        total: item.total,
      })),
    };

    await createRefund.mutateAsync(refundData);
    
    // Reset form
    setSelectedSale(null);
    setSearchTerm('');
    setReason('');
    setRefundType('full');
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
              <div>
                <Label>Rechercher une vente</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Numéro de ticket, client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  {filteredSales.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune vente trouvée
                    </div>
                  ) : (
                    filteredSales.map((sale) => (
                      <Card
                        key={sale.id}
                        className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{sale.sale_number}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(sale.date), 'dd MMM yyyy HH:mm', { locale: fr })}
                              {sale.customers && ` • ${sale.customers.name}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{sale.total.toFixed(2)}€</div>
                            <Badge variant="outline">{sale.payment_method}</Badge>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Détails du remboursement */}
            {selectedSale && (
              <div className="space-y-4">
                <Card className="p-4 bg-muted/50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{selectedSale.sale_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedSale.date), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedSale(null)}
                    >
                      Changer
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {selectedSale.sale_items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span className="font-medium">{item.total.toFixed(2)}€</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t flex justify-between font-bold">
                      <span>Total</span>
                      <span>{selectedSale.total.toFixed(2)}€</span>
                    </div>
                  </div>
                </Card>

                <div>
                  <Label>Type de remboursement</Label>
                  <RadioGroup value={refundType} onValueChange={(v) => setRefundType(v as any)} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full" className="cursor-pointer">Remboursement complet</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id="partial" />
                      <Label htmlFor="partial" className="cursor-pointer">Remboursement partiel</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Méthode de remboursement</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="cursor-pointer">Espèces</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="cursor-pointer">Carte bancaire</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mobile" id="mobile" />
                      <Label htmlFor="mobile" className="cursor-pointer">Mobile</Label>
                    </div>
                  </RadioGroup>
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
                        Le remboursement remettra les produits en stock et créera un mouvement de caisse négatif.
                        Cette action est irréversible.
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSale(null)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateRefund}
                    disabled={!reason.trim() || createRefund.isPending}
                    className="flex-1"
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Créer le remboursement
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