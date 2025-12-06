import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Save, X, Plus, Trash2, Search, Check } from 'lucide-react';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[1000px] max-h-[95vh] p-0 overflow-hidden [&>button]:hidden">
        <div className="flex flex-col h-full max-h-[95vh]">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-gradient-to-r from-primary to-primary-glow shadow-lg">
            <div className="flex items-center justify-between gap-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {invoiceId ? 'Modifier la facture' : 'Nouvelle facture'}
              </h2>
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  onClick={handleSave} 
                  disabled={loading} 
                  className="h-10 px-6 font-semibold shadow-md hover:shadow-lg"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Enregistrer
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onOpenChange(false)} 
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 transition-all shadow-md hover:shadow-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* UBL Warning Alert */}
            {(ublValidation.errors.length > 0 || ublValidation.warnings.length > 0) && (
              <div className="px-4 sm:px-6 pb-0 pt-3 bg-gray-100">
                <div className="mx-auto max-w-[21cm]">
                  <UBLWarningAlert validation={ublValidation} />
                </div>
              </div>
            )}
          </div>

          {/* A4 Invoice Content */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 md:p-8">
            <div className="mx-auto bg-white shadow-xl w-full max-w-[21cm]" style={{ minHeight: '29.7cm', padding: '1.5cm' }}>
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
                      className="font-semibold border-0 border-b border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 px-0 rounded-none bg-transparent transition-colors"
                    />
                    <Input
                      placeholder="Adresse"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="border-0 border-b border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 px-0 rounded-none bg-transparent transition-colors"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Code postal"
                        value={clientPostalCode}
                        onChange={(e) => setClientPostalCode(e.target.value)}
                        className="border-0 border-b border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 px-0 rounded-none bg-transparent transition-colors w-32"
                      />
                      <Input
                        placeholder="Ville"
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                        className="border-0 border-b border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 px-0 rounded-none bg-transparent transition-colors flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="w-72 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Numéro de facture</span>
                    <Input
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="h-8 w-36 text-xs border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 bg-transparent transition-colors font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs">Communication structurée</span>
                    <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border">{structuredCommunication}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Date de facturation</span>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="h-8 w-36 text-xs border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 bg-transparent transition-colors"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Date d'échéance</span>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-8 w-36 text-xs border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 bg-transparent transition-colors"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Numéro TVA client</span>
                    <Input
                      placeholder="BE..."
                      value={clientVatNumber}
                      onChange={(e) => setClientVatNumber(e.target.value)}
                      className="h-8 w-48 text-xs border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 bg-transparent transition-colors"
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
                            className="border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 bg-transparent transition-colors h-9"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="text-center border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 bg-transparent transition-colors h-9"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="text-right border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 bg-transparent transition-colors h-9"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.vatRate}
                            onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                            className="text-center border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 bg-transparent transition-colors h-9 w-20"
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

                <div className="space-y-2 text-sm w-80">
                  <div className="flex justify-between pb-2">
                    <span>Montant imposable</span>
                    <span className="font-semibold">{calculateSubtotal().toFixed(2)} €</span>
                  </div>
                  
                  {/* TVA détaillée par taux */}
                  <div className="border-t pt-2 space-y-1">
                    <div className="font-semibold text-xs text-muted-foreground mb-1">TVA détaillée:</div>
                    {Object.entries(calculateVatByRate()).map(([rate, amounts]) => (
                      <div key={rate} className="flex justify-between text-xs pl-4">
                        <span>TVA {rate}% sur {amounts.base.toFixed(2)}€</span>
                        <span className="font-medium">{amounts.vat.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between pb-2 border-b pt-2">
                    <span className="font-semibold">Total TVA</span>
                    <span className="font-semibold">{calculateTotalVat().toFixed(2)} €</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold pt-2">
                    <span>Total TTC</span>
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
                  className="min-h-[100px] text-sm border-transparent hover:border-gray-300 focus-visible:border-primary focus-visible:ring-0 bg-transparent transition-colors"
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
