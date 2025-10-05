import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Save, X, Plus, Trash2, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import logoInvoice from '@/assets/logo-invoice.png';

interface InvoiceEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId?: string;
}

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export function InvoiceEditor({ open, onOpenChange, invoiceId }: InvoiceEditorProps) {
  const { settings } = useCompanySettings();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();
  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  
  // Client search
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  
  // Client info
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientPostalCode, setClientPostalCode] = useState('');
  const [clientVatNumber, setClientVatNumber] = useState('');
  
  // Product search
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  
  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, vatRate: 21 }
  ]);
  
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && !invoiceId) {
      // Generate invoice number and reset form
      generateInvoiceNumber();
      setDueDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
      setSelectedCustomerId(null);
      setClientName('');
      setClientAddress('');
      setClientCity('');
      setClientPostalCode('');
      setClientVatNumber('');
      setItems([{ description: '', quantity: 1, unitPrice: 0, vatRate: 21 }]);
      setNotes('');
    } else if (open && invoiceId) {
      loadInvoice(invoiceId);
    }
  }, [open, invoiceId]);

  const generateInvoiceNumber = async () => {
    const { data, error } = await supabase.rpc('generate_sale_number', { is_invoice_param: true });
    if (!error && data) {
      setInvoiceNumber(data);
    }
  };

  const loadInvoice = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(*), customers(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      setInvoiceNumber(data.sale_number);
      setInvoiceDate(format(new Date(data.date), 'yyyy-MM-dd'));
      setNotes(data.notes || '');
      
      // Set due date if exists, otherwise default to +7 days
      const saleData = data as any;
      if (saleData.due_date) {
        setDueDate(format(new Date(saleData.due_date), 'yyyy-MM-dd'));
      } else {
        setDueDate(format(addDays(new Date(data.date), 7), 'yyyy-MM-dd'));
      }

      if (data.customers) {
        setSelectedCustomerId(data.customer_id);
        setClientName(data.customers.name);
        setClientAddress(data.customers.address || '');
        setClientCity(data.customers.city || '');
        setClientPostalCode(data.customers.postal_code || '');
        setClientVatNumber(data.customers.vat_number || '');
      }

      if (data.sale_items) {
        setItems(data.sale_items.map((item: any) => ({
          id: item.id,
          description: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          vatRate: item.vat_rate,
        })));
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Erreur lors du chargement de la facture');
    } finally {
      setLoading(false);
    }
  };

  const selectCustomer = (customer: any) => {
    setSelectedCustomerId(customer.id);
    setClientName(customer.name);
    setClientAddress(customer.address || '');
    setClientCity(customer.city || '');
    setClientPostalCode(customer.postal_code || '');
    setClientVatNumber(customer.vat_number || '');
    setCustomerSearchOpen(false);
  };

  const selectProduct = (product: any, index: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      description: product.name,
      unitPrice: product.price,
      vatRate: product.vat_rate,
    };
    setItems(newItems);
    setProductSearchOpen(false);
    setCurrentItemIndex(null);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, vatRate: 21 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const vatAmount = subtotal * (item.vatRate / 100);
    return subtotal + vatAmount;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotalVat = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      return sum + (subtotal * (item.vatRate / 100));
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalVat();
  };

  const getPaymentConditions = () => {
    if (!dueDate) return '';
    const dueDateObj = new Date(dueDate);
    const invoiceDateObj = new Date(invoiceDate);
    const diffDays = Math.ceil((dueDateObj.getTime() - invoiceDateObj.getTime()) / (1000 * 60 * 60 * 24));
    return `Paiement à ${diffDays} jours - Date d'échéance: ${format(dueDateObj, 'dd/MM/yyyy', { locale: fr })}`;
  };

  const handleSave = async () => {
    if (!clientName) {
      toast.error('Veuillez renseigner le nom du client');
      return;
    }

    if (items.length === 0 || !items[0].description) {
      toast.error('Veuillez ajouter au moins un article');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Create or find customer
      let customerId = null;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('name', clientName)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: clientName,
            address: clientAddress,
            city: clientCity,
            postal_code: clientPostalCode,
            vat_number: clientVatNumber,
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      if (invoiceId) {
        // Update existing invoice
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            customer_id: customerId,
            subtotal: calculateSubtotal(),
            total_vat: calculateTotalVat(),
            total: calculateTotal(),
            notes,
          })
          .eq('id', invoiceId);

        if (updateError) throw updateError;

        // Delete old items
        await supabase.from('sale_items').delete().eq('sale_id', invoiceId);

        // Insert new items
        const saleItems = items.map(item => ({
          sale_id: invoiceId,
          product_name: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          vat_rate: item.vatRate,
          subtotal: item.quantity * item.unitPrice,
          vat_amount: (item.quantity * item.unitPrice) * (item.vatRate / 100),
          total: calculateItemTotal(item),
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) throw itemsError;

        toast.success('Facture mise à jour');
      } else {
        // Create new invoice
        const { data: sale, error: saleError } = await supabase
          .from('sales')
          .insert({
            sale_number: invoiceNumber,
            customer_id: customerId,
            cashier_id: user.id,
            subtotal: calculateSubtotal(),
            total_vat: calculateTotalVat(),
            total_discount: 0,
            total: calculateTotal(),
            payment_method: 'card',
            is_invoice: true,
            invoice_status: 'brouillon',
            notes,
            date: new Date(invoiceDate),
            due_date: new Date(dueDate),
          } as any)
          .select()
          .single();

        if (saleError) throw saleError;

        // Insert items
        const saleItems = items.map(item => ({
          sale_id: sale.id,
          product_name: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          vat_rate: item.vatRate,
          subtotal: item.quantity * item.unitPrice,
          vat_amount: (item.quantity * item.unitPrice) * (item.vatRate / 100),
          total: calculateItemTotal(item),
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) throw itemsError;

        toast.success('Facture créée');
      }

      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary to-primary-glow">
            <h2 className="text-xl font-bold text-white">
              {invoiceId ? 'Modifier la facture' : 'Nouvelle facture'}
            </h2>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* A4 Invoice Content */}
          <ScrollArea className="flex-1 bg-gray-100 p-8">
            <div className="mx-auto bg-white shadow-xl" style={{ width: '21cm', minHeight: '29.7cm', padding: '2cm' }}>
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <img src={logoInvoice} alt="Logo" className="h-20 w-auto mb-4" />
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{settings.name}</p>
                  <p>{settings.address}</p>
                  <p>{settings.postal_code} {settings.city}</p>
                  <p className="mt-2">{settings.email}</p>
                  <p className="mt-2 font-semibold">TVA: {settings.vat_number}</p>
                </div>
              </div>

              {/* Client & Invoice Info */}
              <div className="flex justify-between mb-8">
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-4">Facture</h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedCustomerId
                              ? customers?.find((c) => c.id === selectedCustomerId)?.name
                              : "Sélectionner un client..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Rechercher un client..." />
                            <CommandList>
                              <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                              <CommandGroup>
                                {customers?.map((customer) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={customer.name}
                                    onSelect={() => selectCustomer(customer)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {customer.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Input
                      placeholder="Nom du client"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="font-semibold bg-blue-50 border-blue-200 focus-visible:ring-blue-500"
                    />
                    <Input
                      placeholder="Adresse"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="bg-blue-50 border-blue-200 focus-visible:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Code postal"
                        value={clientPostalCode}
                        onChange={(e) => setClientPostalCode(e.target.value)}
                        className="bg-blue-50 border-blue-200 focus-visible:ring-blue-500 w-32"
                      />
                      <Input
                        placeholder="Ville"
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                        className="bg-blue-50 border-blue-200 focus-visible:ring-blue-500 flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="w-72 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Numéro de facture</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Date de facturation</span>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="h-8 w-36 text-xs bg-blue-50 border-blue-200"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Date d'échéance</span>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-8 w-36 text-xs bg-blue-50 border-blue-200"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Numéro TVA client</span>
                    <Input
                      placeholder="BE..."
                      value={clientVatNumber}
                      onChange={(e) => setClientVatNumber(e.target.value)}
                      className="h-8 w-36 text-xs bg-blue-50 border-blue-200"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-800">
                      <th className="text-left py-2 px-2 w-10"></th>
                      <th className="text-left py-2 px-2">Description</th>
                      <th className="text-center py-2 px-2 w-24">Quantité</th>
                      <th className="text-right py-2 px-2 w-32">Prix unitaire</th>
                      <th className="text-right py-2 px-2 w-24">TVA %</th>
                      <th className="text-right py-2 px-2 w-32">Total</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">
                          <Popover open={productSearchOpen && currentItemIndex === index} onOpenChange={(open) => {
                            setProductSearchOpen(open);
                            if (open) setCurrentItemIndex(index);
                            else setCurrentItemIndex(null);
                          }}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Rechercher un produit..." />
                                <CommandList>
                                  <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                                  <CommandGroup>
                                    {products?.filter(p => p.is_active).map((product) => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.name}
                                        onSelect={() => selectProduct(product, index)}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">{product.name}</span>
                                          <span className="text-sm text-muted-foreground">
                                            {product.price.toFixed(2)}€ - TVA: {product.vat_rate}%
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            placeholder="Description de l'article"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="bg-blue-50 border-blue-200 focus-visible:ring-blue-500 h-9"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="text-center bg-blue-50 border-blue-200 focus-visible:ring-blue-500 h-9"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="text-right bg-blue-50 border-blue-200 focus-visible:ring-blue-500 h-9"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.vatRate}
                            onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                            className="text-center bg-blue-50 border-blue-200 focus-visible:ring-blue-500 h-9 w-20"
                          />
                        </td>
                        <td className="py-2 px-2 text-right font-semibold">
                          {calculateItemTotal(item).toFixed(2)} €
                        </td>
                        <td className="py-2 px-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-7 w-7 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </div>

              {/* Reference & Totals */}
              <div className="flex justify-between items-start mb-8">
                <div className="bg-primary text-white p-4 rounded-lg max-w-xs">
                  <p className="font-bold mb-2">Référence de paiement</p>
                  <p className="text-xl font-mono">{invoiceNumber}</p>
                </div>

                <div className="space-y-2 text-sm w-64">
                  <div className="flex justify-between pb-2">
                    <span>Montant imposable</span>
                    <span className="font-semibold">{calculateSubtotal().toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b">
                    <span>+ TVA (21%)</span>
                    <span className="font-semibold">{calculateTotalVat().toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{calculateTotal().toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <Label className="text-sm font-semibold mb-2 block">Notes</Label>
                <Textarea
                  placeholder="Notes ou instructions de paiement..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px] text-sm bg-blue-50 border-blue-200 focus-visible:ring-blue-500"
                />
              </div>

              {/* Footer */}
              <div className="border-t pt-4 space-y-4">
                <div className="text-sm text-center font-semibold text-primary">
                  {getPaymentConditions()}
                </div>
                <div className="grid grid-cols-4 gap-8 text-xs text-gray-600">
                  <div>
                    <p className="font-semibold mb-1">Siège social</p>
                    <p>{settings.address}</p>
                    <p>{settings.postal_code} {settings.city}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Bureau</p>
                    <p>{settings.address}</p>
                    <p>{settings.postal_code} {settings.city}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Compte bancaire</p>
                    <p>IBAN à configurer</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Questions ?</p>
                    <p>{settings.phone}</p>
                    <p>{settings.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
