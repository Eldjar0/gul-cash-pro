import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Save, X, Plus, Trash2, Search, Check, FileText, User, Calendar, Euro, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { getSpecialPriceForCustomer } from '@/hooks/useCustomerSpecialPrices';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import logoInvoice from '@/assets/logo-invoice.png';
import { validateUBLDocument, UBLValidationResult } from '@/utils/validateUBL';
import { UBLWarningAlert } from './UBLWarningAlert';

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
  const [structuredCommunication, setStructuredCommunication] = useState('');
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
      setStructuredCommunication(generateStructuredCommunication());
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

  const generateStructuredCommunication = () => {
    // Génère une communication structurée belge (format +++XXX/XXXX/XXXXX+++)
    const random = Math.floor(Math.random() * 9999999999).toString().padStart(10, '0');
    const part1 = random.substring(0, 3);
    const part2 = random.substring(3, 7);
    const part3 = random.substring(7, 10);
    
    // Calcul du modulo 97 pour les 2 derniers chiffres
    const num = parseInt(random);
    const mod = num % 97;
    const checksum = mod === 0 ? 97 : mod;
    
    return `+++${part1}/${part2}/${part3}${checksum.toString().padStart(2, '0')}+++`;
  };

  const validateInvoiceNumber = async (number: string): Promise<boolean> => {
    if (!number) return false;
    
    const { data, error } = await supabase
      .from('sales')
      .select('id')
      .eq('sale_number', number)
      .eq('is_invoice', true)
      .maybeSingle();
    
    if (error) {
      console.error('Error validating invoice number:', error);
      return false;
    }
    
    // Si on est en mode édition et que le numéro appartient à la facture en cours, c'est ok
    if (invoiceId && data?.id === invoiceId) {
      return true;
    }
    
    // Sinon, le numéro ne doit pas exister
    return !data;
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

  const selectProduct = async (product: any, index: number) => {
    const newItems = [...items];
    
    // Vérifier si un prix spécial existe pour ce client
    let finalPrice = product.price;
    if (selectedCustomerId) {
      const specialPrice = await getSpecialPriceForCustomer(selectedCustomerId, product.id);
      if (specialPrice !== null) {
        finalPrice = specialPrice;
      }
    }
    
    newItems[index] = {
      ...newItems[index],
      description: product.name,
      unitPrice: finalPrice,
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

  const calculateVatByRate = () => {
    const vatByRate: { [key: number]: { base: number; vat: number } } = {};
    
    items.forEach(item => {
      const rate = item.vatRate;
      const subtotal = item.quantity * item.unitPrice;
      const vatAmount = subtotal * (rate / 100);
      
      if (!vatByRate[rate]) {
        vatByRate[rate] = { base: 0, vat: 0 };
      }
      
      vatByRate[rate].base += subtotal;
      vatByRate[rate].vat += vatAmount;
    });
    
    return vatByRate;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalVat();
  };

  // Validation UBL en temps réel
  const ublValidation = useMemo((): UBLValidationResult => {
    return validateUBLDocument({
      sale_number: invoiceNumber,
      date: invoiceDate,
      customers: {
        name: clientName,
        vat_number: clientVatNumber,
        address: clientAddress,
        city: clientCity,
        postal_code: clientPostalCode,
      },
      sale_items: items.map(item => ({
        product_name: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        vat_rate: item.vatRate,
      })),
      subtotal: calculateSubtotal(),
      total_vat: calculateTotalVat(),
      total: calculateTotal(),
    }, {
      name: settings.name,
      vatNumber: settings.vat_number,
      address: settings.address,
      city: settings.city,
      postalCode: settings.postal_code,
      phone: settings.phone,
      email: settings.email,
      iban: settings.bank_iban,
      bic: settings.bank_bic,
    });
  }, [invoiceNumber, invoiceDate, clientName, clientVatNumber, clientAddress, clientCity, clientPostalCode, items, settings]);

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

    // Valider le numéro de facture
    const isValid = await validateInvoiceNumber(invoiceNumber);
    if (!isValid) {
      toast.error('Ce numéro de facture existe déjà. Veuillez en choisir un autre.');
      return;
    }

    // Avertissement UBL (informatif, ne bloque pas)
    if (ublValidation.errors.length > 0 || ublValidation.warnings.length > 0) {
      toast.warning('Conformité UBL.BE', {
        description: `${ublValidation.errors.length} erreur(s), ${ublValidation.warnings.length} avertissement(s) pour l'export UBL`,
      });
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
            due_date: new Date(dueDate),
          } as any)
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

  // Calcul pour l'aperçu (similaire à InvoiceCreate)
  const calculateItemTotalForPreview = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const vatAmount = subtotal * (item.vatRate / 100);
    return subtotal + vatAmount;
  };

  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden [&>button]:hidden">
        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-primary to-primary-glow shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {invoiceId ? 'Modifier la facture' : 'Nouvelle facture'}
              </h2>
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={loading} 
                  className="font-semibold shadow-md hover:shadow-lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onOpenChange(false)} 
                  className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* UBL Warning */}
          {(ublValidation.errors.length > 0 || ublValidation.warnings.length > 0) && (
            <div className="px-4 py-2 bg-gray-100">
              <UBLWarningAlert validation={ublValidation} />
            </div>
          )}

          {/* Main Content - Two Columns */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              {/* Left: Form */}
              <ScrollArea className="h-[calc(95vh-100px)] bg-gray-50">
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Invoice Info */}
                  <Card className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold">Numéro de facture</Label>
                        <Input
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          className="h-9 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Communication</Label>
                        <div className="h-9 flex items-center text-xs font-mono bg-muted px-3 rounded-md border">
                          {structuredCommunication}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Date</Label>
                        <Input
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Échéance</Label>
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Client Selection */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-primary" />
                      <Label className="font-bold text-primary">Client</Label>
                    </div>
                    <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-9">
                          {selectedCustomerId
                            ? customers?.find((c) => c.id === selectedCustomerId)?.name
                            : "Sélectionner un client..."}
                          <Search className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0">
                        <Command>
                          <CommandInput placeholder="Rechercher..." />
                          <CommandList>
                            <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                            <CommandGroup>
                              {customers?.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.name}
                                  onSelect={() => selectCustomer(customer)}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === customer.id ? "opacity-100" : "opacity-0")} />
                                  {customer.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Input placeholder="Nom" value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-9 text-sm" />
                      <Input placeholder="N° TVA" value={clientVatNumber} onChange={(e) => setClientVatNumber(e.target.value)} className="h-9 text-sm" />
                      <Input placeholder="Adresse" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="h-9 text-sm col-span-2" />
                      <Input placeholder="Code postal" value={clientPostalCode} onChange={(e) => setClientPostalCode(e.target.value)} className="h-9 text-sm" />
                      <Input placeholder="Ville" value={clientCity} onChange={(e) => setClientCity(e.target.value)} className="h-9 text-sm" />
                    </div>
                  </Card>

                  {/* Items */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        <Label className="font-bold text-primary">Articles</Label>
                        <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                      </div>
                      <Button size="sm" onClick={addItem} className="h-8">
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                            {items.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-6 w-6 text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2 mb-2">
                            <Popover open={productSearchOpen && currentItemIndex === index} onOpenChange={(open) => { setProductSearchOpen(open); if (open) setCurrentItemIndex(index); else setCurrentItemIndex(null); }}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                                  <Search className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0">
                                <Command>
                                  <CommandInput placeholder="Rechercher produit..." />
                                  <CommandList>
                                    <CommandEmpty>Aucun produit.</CommandEmpty>
                                    <CommandGroup>
                                      {products?.filter(p => p.is_active).map((product) => (
                                        <CommandItem key={product.id} value={product.name} onSelect={() => selectProduct(product, index)}>
                                          <div className="flex flex-col">
                                            <span className="font-medium">{product.name}</span>
                                            <span className="text-xs text-muted-foreground">{product.price.toFixed(2)}€ - TVA {product.vat_rate}%</span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className="h-9 text-sm flex-1" />
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Qté</Label>
                              <Input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} className="h-8 text-sm text-center" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Prix HT</Label>
                              <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-8 text-sm text-right" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">TVA %</Label>
                              <Input type="number" min="0" step="0.01" value={item.vatRate} onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)} className="h-8 text-sm text-center" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Total TTC</Label>
                              <div className="h-8 flex items-center justify-end text-sm font-semibold text-primary">{calculateItemTotalForPreview(item).toFixed(2)}€</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Notes */}
                  <Card className="p-4">
                    <Label className="text-xs font-semibold mb-2 block">Notes</Label>
                    <Textarea
                      placeholder="Notes ou instructions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                  </Card>
                </div>
              </ScrollArea>

              {/* Right: Preview (identical to InvoiceCreate) */}
              <div className="hidden lg:block border-l bg-white">
                <ScrollArea className="h-[calc(95vh-100px)]">
                  <div className="p-6">
                    <Card className="bg-white shadow-xl border-2 border-primary/20 overflow-hidden">
                      {/* Preview Header */}
                      <div className="bg-gradient-to-r from-primary via-primary-glow to-primary p-5 text-white">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">Aperçu Facture</h2>
                            <p className="text-sm text-white/90">Prévisualisation en temps réel</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-5">
                        {/* Company Header */}
                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                          <div className="text-lg font-bold text-primary mb-1">{settings.name}</div>
                          <div className="space-y-0.5 text-sm text-muted-foreground">
                            <div>{settings.address}</div>
                            <div>{settings.postal_code} {settings.city}</div>
                            <div className="font-semibold text-foreground">TVA: {settings.vat_number}</div>
                          </div>
                        </div>

                        {/* Invoice Info */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(invoiceDate), 'dd MMMM yyyy', { locale: fr })}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Échéance: {format(new Date(dueDate), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary mb-1">FACTURE</div>
                            <Badge variant="outline" className="font-mono text-xs">{invoiceNumber}</Badge>
                          </div>
                        </div>

                        <Separator />

                        {/* Customer Section */}
                        {clientName ? (
                          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                              <User className="h-3 w-3" />
                              FACTURÉ À
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-bold">{clientName}</div>
                              {clientVatNumber && <div className="text-sm text-muted-foreground">N° TVA: {clientVatNumber}</div>}
                              {clientAddress && <div className="text-sm text-muted-foreground">{clientAddress}</div>}
                              {clientCity && <div className="text-sm text-muted-foreground">{clientPostalCode} {clientCity}</div>}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-muted/50 rounded-xl p-4 border-2 border-dashed border-muted-foreground/20 text-center">
                            <User className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">Aucun client sélectionné</p>
                          </div>
                        )}

                        <Separator />

                        {/* Items Section */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                            <h3 className="font-bold text-primary">Articles</h3>
                            <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                          </div>
                          
                          {items.length > 0 && items[0].description ? (
                            <div className="space-y-2">
                              {items.map((item, index) => (
                                <div key={index} className="border rounded-lg p-3 bg-gradient-to-br from-white to-gray-50">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                                        <span className="font-medium text-sm">{item.description || 'Article sans nom'}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>Qté: <span className="font-semibold text-foreground">{item.quantity}</span></span>
                                        <span>×</span>
                                        <span>PU HT: <span className="font-semibold text-foreground">{item.unitPrice.toFixed(2)}€</span></span>
                                        <span>TVA: <span className="font-semibold text-accent">{item.vatRate}%</span></span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-muted-foreground">Total TTC</div>
                                      <div className="font-bold text-primary">{calculateItemTotalForPreview(item).toFixed(2)}€</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-muted/50 rounded-xl p-6 border-2 border-dashed border-muted-foreground/20 text-center">
                              <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Aucun article ajouté</p>
                            </div>
                          )}
                        </div>

                        <Separator />

                        {/* Totals Section */}
                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Total HT:</span>
                              <span className="font-bold">{calculateSubtotal().toFixed(2)}€</span>
                            </div>
                            
                            {Object.entries(calculateVatByRate()).map(([rate, amounts]) => (
                              <div key={rate} className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">TVA {rate}%:</span>
                                <span className="font-semibold text-accent">{amounts.vat.toFixed(2)}€</span>
                              </div>
                            ))}
                            
                            <Separator className="bg-primary/20" />
                            
                            <div className="flex justify-between items-center bg-primary text-white rounded-lg p-3 shadow-lg">
                              <div className="flex items-center gap-2">
                                <Euro className="h-5 w-5" />
                                <span className="font-bold">Total TTC:</span>
                              </div>
                              <span className="text-xl font-bold">{calculateTotal().toFixed(2)}€</span>
                            </div>
                          </div>
                        </div>

                        {/* Notes Section */}
                        {notes && (
                          <>
                            <Separator />
                            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-bold text-primary">Notes</h4>
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
