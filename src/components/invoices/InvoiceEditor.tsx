import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  unitPriceTVAC: number; // Prix TVAC pour édition directe
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
    { description: '', quantity: 1, unitPrice: 0, unitPriceTVAC: 0, vatRate: 21 }
  ]);
  
  const [notes, setNotes] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  
  // Terminologie belge: HTVA (hors TVA) et TVAC (TVA comprise)
  const labelHT = 'HTVA';
  const labelTTC = 'TVAC';

  // Vérifier si le formulaire a des données
  const hasFormData = useCallback(() => {
    return clientName.trim() !== '' || 
           items.some(item => item.description.trim() !== '' || item.unitPrice > 0);
  }, [clientName, items]);

  // Sauvegarde automatique en brouillon
  const saveDraft = async () => {
    if (!hasFormData()) return;
    
    setSavingDraft(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Créer ou trouver le client
      let customerId = selectedCustomerId;
      if (!customerId && clientName.trim()) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('name', clientName)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer } = await supabase
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
          
          if (newCustomer) customerId = newCustomer.id;
        }
      }

      // Créer la facture brouillon
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
          notes: notes || 'Brouillon auto-sauvegardé',
          date: new Date(invoiceDate),
          due_date: new Date(dueDate),
        } as any)
        .select()
        .single();

      if (saleError) throw saleError;

      // Insérer les articles si la facture a été créée
      if (sale && items.some(item => item.description.trim() !== '')) {
        const saleItems = items
          .filter(item => item.description.trim() !== '')
          .map(item => ({
            sale_id: sale.id,
            product_name: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            vat_rate: item.vatRate,
            subtotal: item.quantity * item.unitPrice,
            vat_amount: (item.quantity * item.unitPrice) * (item.vatRate / 100),
            total: item.quantity * item.unitPrice * (1 + item.vatRate / 100),
          }));

        await supabase.from('sale_items').insert(saleItems);
      }

      toast.success('Facture sauvegardée en brouillon');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Erreur lors de la sauvegarde du brouillon');
    } finally {
      setSavingDraft(false);
    }
  };

  // Gérer la tentative de fermeture
  const handleCloseAttempt = useCallback(() => {
    if (hasFormData()) {
      setShowExitConfirm(true);
    } else {
      onOpenChange(false);
    }
  }, [hasFormData, onOpenChange]);

  // Fermer sans sauvegarder
  const handleCloseWithoutSaving = () => {
    setShowExitConfirm(false);
    onOpenChange(false);
  };

  // Sauvegarder et fermer
  const handleSaveAndClose = async () => {
    setShowExitConfirm(false);
    await saveDraft();
    onOpenChange(false);
    window.location.reload();
  };

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
      setItems([{ description: '', quantity: 1, unitPrice: 0, unitPriceTVAC: 0, vatRate: 21 }]);
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
        setItems(data.sale_items.map((item: any) => {
          const unitPrice = item.unit_price;
          const vatRate = item.vat_rate;
          const unitPriceTVAC = unitPrice * (1 + vatRate / 100);
          return {
            id: item.id,
            description: item.product_name,
            quantity: item.quantity,
            unitPrice,
            unitPriceTVAC: Math.round(unitPriceTVAC * 100) / 100,
            vatRate,
          };
        }));
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
    
    const unitPriceTVAC = finalPrice * (1 + product.vat_rate / 100);
    newItems[index] = {
      ...newItems[index],
      description: product.name,
      unitPrice: finalPrice,
      unitPriceTVAC: Math.round(unitPriceTVAC * 100) / 100,
      vatRate: product.vat_rate,
    };
    setItems(newItems);
    setProductSearchOpen(false);
    setCurrentItemIndex(null);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, unitPriceTVAC: 0, vatRate: 21 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Mise à jour du prix HTVA et recalcul du TVAC
  const updateItemHTVA = (index: number, priceHTVA: number) => {
    const newItems = [...items];
    const vatRate = newItems[index].vatRate;
    const priceTVAC = priceHTVA * (1 + vatRate / 100);
    newItems[index] = { 
      ...newItems[index], 
      unitPrice: priceHTVA,
      unitPriceTVAC: Math.round(priceTVAC * 100) / 100
    };
    setItems(newItems);
  };

  // Mise à jour du prix TVAC et recalcul du HTVA
  const updateItemTVAC = (index: number, priceTVAC: number) => {
    const newItems = [...items];
    const vatRate = newItems[index].vatRate;
    const priceHTVA = priceTVAC / (1 + vatRate / 100);
    newItems[index] = { 
      ...newItems[index], 
      unitPrice: Math.round(priceHTVA * 100) / 100,
      unitPriceTVAC: priceTVAC
    };
    setItems(newItems);
  };

  // Mise à jour du taux TVA et recalcul du prix TVAC
  const updateItemVatRate = (index: number, newVatRate: number) => {
    const newItems = [...items];
    const unitPrice = newItems[index].unitPrice;
    const priceTVAC = unitPrice * (1 + newVatRate / 100);
    newItems[index] = { 
      ...newItems[index], 
      vatRate: newVatRate,
      unitPriceTVAC: Math.round(priceTVAC * 100) / 100
    };
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
    <>
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleCloseAttempt();
        }
      }}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden [&>button]:hidden"
          onPointerDownOutside={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
          onInteractOutside={(e) => e.preventDefault()}
        >
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
                    onClick={handleCloseAttempt} 
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
                            <Input placeholder="Description" value={item.description} onChange={(e) => {
                              const newItems = [...items];
                              newItems[index] = { ...newItems[index], description: e.target.value };
                              setItems(newItems);
                            }} className="h-9 text-sm flex-1" />
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Qté</Label>
                              <Input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => {
                                const newItems = [...items];
                                newItems[index] = { ...newItems[index], quantity: parseFloat(e.target.value) || 0 };
                                setItems(newItems);
                              }} className="h-8 text-sm text-center" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Prix {labelHT}</Label>
                              <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItemHTVA(index, parseFloat(e.target.value) || 0)} className="h-8 text-sm text-right" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Prix {labelTTC}</Label>
                              <Input type="number" min="0" step="0.01" value={item.unitPriceTVAC} onChange={(e) => updateItemTVAC(index, parseFloat(e.target.value) || 0)} className="h-8 text-sm text-right" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">TVA %</Label>
                              <Input type="number" min="0" step="0.01" value={item.vatRate} onChange={(e) => updateItemVatRate(index, parseFloat(e.target.value) || 0)} className="h-8 text-sm text-center" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Total {labelTTC}</Label>
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

              {/* Right: Preview - Identique à InvoiceCreate */}
              <div className="hidden lg:block border-l bg-white">
                <ScrollArea className="h-[calc(95vh-100px)]">
                  <div className="p-6">
                    <Card className="bg-white shadow-2xl border-2 border-primary/20 overflow-hidden">
                      {/* Preview Header */}
                      <div className="bg-gradient-to-r from-primary via-primary-glow to-primary p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                              <FileText className="h-7 w-7" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">Aperçu Facture</h2>
                              <p className="text-sm text-white/90">Prévisualisation en temps réel</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-6">
                        {/* Company Header */}
                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border-2 border-primary/20">
                          <div className="text-xl font-bold text-primary mb-2">{settings.name}</div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>{settings.address}</div>
                            <div>{settings.postal_code} {settings.city}</div>
                            <div className="font-semibold text-foreground">TVA: {settings.vat_number}</div>
                            {settings.phone && <div>Tél: {settings.phone}</div>}
                          </div>
                        </div>

                        {/* Invoice Info */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(invoiceDate), 'dd MMMM yyyy', { locale: fr })}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Échéance: {format(new Date(dueDate), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-primary mb-1">FACTURE</div>
                            <Badge variant="outline" className="font-mono">
                              N° {invoiceNumber}
                            </Badge>
                          </div>
                        </div>

                        <Separator />

                        {/* Customer Section */}
                        {clientName ? (
                          <div className="bg-primary/5 rounded-xl p-5 border-2 border-primary/20">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                              <User className="h-4 w-4" />
                              FACTURÉ À
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-lg">{clientName}</div>
                              {clientVatNumber && (
                                <div className="text-sm text-muted-foreground">N° TVA: {clientVatNumber}</div>
                              )}
                              {clientAddress && (
                                <div className="text-sm text-muted-foreground">{clientAddress}</div>
                              )}
                              {clientCity && (
                                <div className="text-sm text-muted-foreground">
                                  {clientPostalCode} {clientCity}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-muted/50 rounded-xl p-5 border-2 border-dashed border-muted-foreground/20 text-center">
                            <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Aucun client sélectionné</p>
                          </div>
                        )}

                        <Separator />

                        {/* Items Section */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-bold text-primary">Articles</h3>
                            <Badge variant="secondary">{items.length}</Badge>
                          </div>
                          
                          {items.length > 0 && items[0].description ? (
                            <div className="space-y-3">
                              {items.map((item, index) => {
                                const itemSubtotal = item.quantity * item.unitPrice;
                                const itemVat = itemSubtotal * (item.vatRate / 100);
                                const itemTotal = itemSubtotal + itemVat;
                                return (
                                  <div key={index} className="border-2 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 hover:border-primary/30 transition-smooth">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                                          <span className="font-semibold text-sm">{item.description || 'Article sans nom'}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                          <span>Qté: <span className="font-semibold text-foreground">{item.quantity}</span></span>
                                          <span>×</span>
                                          <span>PU {labelHT}: <span className="font-semibold text-foreground">{item.unitPrice.toFixed(2)}€</span></span>
                                          <span>TVA: <span className="font-semibold text-accent">{item.vatRate}%</span></span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xs text-muted-foreground mb-1">Total {labelTTC}</div>
                                        <div className="text-lg font-bold text-primary">{itemTotal.toFixed(2)}€</div>
                                      </div>
                                    </div>
                                    {/* Détails ligne */}
                                    <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 mt-2">
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center">
                                          <div className="text-xs text-muted-foreground font-medium mb-1">Total {labelHT}</div>
                                          <div className="font-bold text-sm">{itemSubtotal.toFixed(2)}€</div>
                                        </div>
                                        <div className="text-center border-x border-primary/20">
                                          <div className="text-xs text-muted-foreground font-medium mb-1">TVA ({item.vatRate}%)</div>
                                          <div className="font-bold text-sm text-accent">{itemVat.toFixed(2)}€</div>
                                        </div>
                                        <div className="text-center">
                                          <div className="text-xs text-muted-foreground font-medium mb-1">Total {labelTTC}</div>
                                          <div className="font-bold text-base text-primary">{itemTotal.toFixed(2)}€</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-muted/50 rounded-xl p-8 border-2 border-dashed border-muted-foreground/20 text-center">
                              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                              <p className="text-sm text-muted-foreground">Aucun article ajouté</p>
                            </div>
                          )}
                        </div>

                        <Separator className="my-6" />

                        {/* Récapitulatif TVA par taux - Tableau détaillé */}
                        <div className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-5 border border-muted-foreground/20">
                          <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">RÉCAPITULATIF TVA</span>
                          </h4>
                          <div className="overflow-hidden rounded-lg border border-muted-foreground/20">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/80">
                                <tr>
                                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Taux</th>
                                  <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Base {labelHT}</th>
                                  <th className="text-right px-3 py-2 font-semibold text-muted-foreground">TVA</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                {Object.entries(calculateVatByRate()).map(([rate, amounts], idx, arr) => (
                                  <tr key={rate} className={idx < arr.length - 1 ? "border-b border-muted/50" : ""}>
                                    <td className="px-3 py-2">
                                      <Badge variant="outline" className="font-mono">{rate}%</Badge>
                                    </td>
                                    <td className="text-right px-3 py-2 font-medium">{amounts.base.toFixed(2)}€</td>
                                    <td className="text-right px-3 py-2 font-bold text-accent">{amounts.vat.toFixed(2)}€</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Totals Section - Plus détaillé */}
                        <div className="bg-gradient-to-br from-primary/5 to-primary/15 rounded-xl p-6 border-2 border-primary/30 shadow-lg">
                          <div className="space-y-4">
                            {/* Sous-total HT */}
                            <div className="flex justify-between items-center pb-3 border-b border-primary/20">
                              <span className="text-base font-semibold text-muted-foreground">Sous-total {labelHT}</span>
                              <span className="text-xl font-bold">{calculateSubtotal().toFixed(2)}€</span>
                            </div>
                            
                            {/* Détail TVA par taux */}
                            <div className="space-y-2">
                              {Object.entries(calculateVatByRate()).map(([rate, amounts]) => (
                                <div key={rate} className="flex justify-between items-center bg-white/50 rounded-lg px-4 py-2">
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-accent/20 text-accent border-accent/30 font-mono">{rate}%</Badge>
                                    <span className="text-sm text-muted-foreground">sur {amounts.base.toFixed(2)}€</span>
                                  </div>
                                  <span className="text-base font-bold text-accent">+{amounts.vat.toFixed(2)}€</span>
                                </div>
                              ))}
                            </div>

                            {/* Total TVA */}
                            <div className="flex justify-between items-center pt-3 border-t border-primary/20">
                              <span className="text-base font-semibold text-muted-foreground">Total TVA</span>
                              <span className="text-xl font-bold text-accent">{calculateTotalVat().toFixed(2)}€</span>
                            </div>
                            
                            {/* Total TTC - Mis en avant */}
                            <div className="flex justify-between items-center bg-primary text-white rounded-xl p-5 shadow-xl mt-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                  <Euro className="h-7 w-7" />
                                </div>
                                <div>
                                  <div className="text-xs text-white/80 uppercase tracking-wide">Montant à payer</div>
                                  <span className="text-xl font-bold">Total {labelTTC}</span>
                                </div>
                              </div>
                              <span className="text-3xl font-black">{calculateTotal().toFixed(2)}€</span>
                            </div>
                          </div>
                        </div>

                        {/* Conditions de paiement */}
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            <h4 className="text-sm font-bold text-amber-800">Conditions de paiement</h4>
                          </div>
                          <p className="text-sm text-amber-700">{getPaymentConditions()}</p>
                        </div>

                        {/* Coordonnées bancaires */}
                        {settings.bank_iban && (
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <h4 className="text-sm font-bold text-blue-800 mb-3">Coordonnées bancaires</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <div className="text-xs text-blue-600 font-medium">IBAN</div>
                                <div className="font-mono font-bold text-blue-900">{settings.bank_iban}</div>
                              </div>
                              {settings.bank_bic && (
                                <div>
                                  <div className="text-xs text-blue-600 font-medium">BIC</div>
                                  <div className="font-mono font-bold text-blue-900">{settings.bank_bic}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Communication structurée */}
                        {structuredCommunication && (
                          <div className="bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-xl p-5 border-2 border-primary/30 text-center">
                            <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">Communication structurée</div>
                            <div className="text-2xl font-mono font-black text-primary tracking-wider">{structuredCommunication}</div>
                            <div className="text-xs text-muted-foreground mt-2">À mentionner lors du paiement</div>
                          </div>
                        )}

                        {/* Notes Section */}
                        {notes && (
                          <div className="bg-muted/30 rounded-xl p-5 border border-muted-foreground/20">
                            <div className="flex items-center gap-2 mb-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <h4 className="text-sm font-bold text-foreground">Notes & Remarques</h4>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-white/50 p-3 rounded-lg">{notes}</p>
                          </div>
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

    {/* Confirmation Dialog */}
    <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quitter la facture ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous avez des données non enregistrées. Voulez-vous sauvegarder cette facture en brouillon avant de quitter ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCloseWithoutSaving}>
            Quitter sans sauvegarder
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleSaveAndClose} disabled={savingDraft}>
            {savingDraft ? 'Sauvegarde...' : 'Sauvegarder en brouillon'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
