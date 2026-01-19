import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, Trash2, User, Search, Package } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { useCreateCreditNote, useCreditNote, CreditNoteItem } from '@/hooks/useCreditNotes';
import { toast } from 'sonner';

interface CreditNoteEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditNoteId?: string;
}

export function CreditNoteEditor({ open, onOpenChange, creditNoteId }: CreditNoteEditorProps) {
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CreditNoteItem[]>([]);
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: existingCreditNote } = useCreditNote(creditNoteId);
  const createCreditNote = useCreateCreditNote();

  const selectedCustomer = customers.find(c => c.id === customerId);

  // Load existing credit note data
  useEffect(() => {
    if (existingCreditNote) {
      setCustomerId(existingCreditNote.customer_id || undefined);
      setReason(existingCreditNote.reason);
      setNotes(existingCreditNote.notes || '');
      setItems(existingCreditNote.credit_note_items || []);
    } else {
      // Reset form for new credit note
      setCustomerId(undefined);
      setReason('');
      setNotes('');
      setItems([]);
    }
  }, [existingCreditNote, open]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 10);
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase())
    ).slice(0, 10);
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch || productSearch.length < 2) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 15);
  }, [products, productSearch]);

  const addItem = (product: typeof products[0]) => {
    const htva = product.price / (1 + product.vat_rate / 100);
    const vatAmount = product.price - htva;
    
    const newItem: CreditNoteItem = {
      product_id: product.id,
      product_name: product.name,
      product_barcode: product.barcode || undefined,
      quantity: 1,
      unit_price: htva,
      vat_rate: product.vat_rate,
      subtotal: htva,
      vat_amount: vatAmount,
      total: product.price,
    };
    
    setItems([...items, newItem]);
    setProductPopoverOpen(false);
    setProductSearch('');
  };

  const updateItem = (index: number, field: keyof CreditNoteItem, value: number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    if (field === 'quantity') {
      item.quantity = value;
    } else if (field === 'unit_price') {
      item.unit_price = value;
    }
    
    item.subtotal = item.quantity * item.unit_price;
    item.vat_amount = item.subtotal * (item.vat_rate / 100);
    item.total = item.subtotal + item.vat_amount;
    
    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = items.reduce((sum, item) => sum + item.vat_amount, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, totalVat, total };
  }, [items]);

  const handleSave = async () => {
    if (!reason.trim()) {
      toast.error('Veuillez indiquer un motif');
      return;
    }
    if (items.length === 0) {
      toast.error('Ajoutez au moins un article');
      return;
    }

    try {
      await createCreditNote.mutateAsync({
        customer_id: customerId,
        reason,
        notes,
        items,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving credit note:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {creditNoteId ? 'Modifier la note de crédit' : 'Nouvelle note de crédit'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
              <Label>Client (optionnel)</Label>
              <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <User className="h-4 w-4" />
                    {selectedCustomer ? selectedCustomer.name : 'Sélectionner un client'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Rechercher un client..." 
                      value={customerSearch}
                      onValueChange={setCustomerSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Aucun client trouvé</CommandEmpty>
                      <CommandGroup>
                        {filteredCustomers.map(customer => (
                          <CommandItem
                            key={customer.id}
                            onSelect={() => {
                              setCustomerId(customer.id);
                              setCustomerPopoverOpen(false);
                            }}
                          >
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedCustomer && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCustomerId(undefined)}
                  className="text-muted-foreground"
                >
                  Retirer le client
                </Button>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Motif de la note de crédit *</Label>
              <Input
                placeholder="Ex: Retour marchandise, Erreur de facturation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Articles</Label>
                <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Ajouter un article
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-0 bg-background z-50" align="end">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Tapez au moins 2 lettres pour rechercher..." 
                        value={productSearch}
                        onValueChange={setProductSearch}
                      />
                      <CommandList className="max-h-[300px]">
                        {productSearch.length < 2 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p>Tapez au moins 2 caractères pour rechercher</p>
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <CommandEmpty>Aucun produit trouvé</CommandEmpty>
                        ) : (
                          <CommandGroup heading={`${filteredProducts.length} résultat(s)`}>
                            {filteredProducts.map(product => (
                              <CommandItem
                                key={product.id}
                                value={product.id}
                                onSelect={() => addItem(product)}
                                className="cursor-pointer py-3 hover:bg-accent"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Package className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{product.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {product.barcode && <span className="font-mono">{product.barcode}</span>}
                                      <span>TVA {product.vat_rate}%</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-primary">{product.price.toFixed(2)}€</p>
                                    <p className="text-xs text-muted-foreground">TTC</p>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {items.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun article ajouté</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">TVA {item.vat_rate}%</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div>
                            <Label className="text-xs">Qté</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                              className="w-20"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Prix HT</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price.toFixed(2)}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </div>
                          <div className="text-right">
                            <Label className="text-xs">Total TTC</Label>
                            <p className="font-bold text-primary">{item.total.toFixed(2)}€</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Notes internes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Totals */}
            {items.length > 0 && (
              <Card className="p-4 bg-muted/50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total HT</span>
                    <span>{totals.subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA</span>
                    <span>{totals.totalVat.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total TTC</span>
                    <span className="text-primary">{totals.total.toFixed(2)}€</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={createCreditNote.isPending}>
            {createCreditNote.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
