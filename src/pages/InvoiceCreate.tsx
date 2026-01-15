import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Save, 
  Download, 
  FileText, 
  User, 
  Calendar, 
  Euro, 
  ShoppingCart, 
  Receipt 
} from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { useCreateSale } from '@/hooks/useSales';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { downloadInvoicePDF } from '@/utils/generateInvoicePDF';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { validateUBLDocument, UBLValidationResult } from '@/utils/validateUBL';
import { UBLWarningAlert } from '@/components/invoices/UBLWarningAlert';

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  price: number;
  vatRate: number;
  productId?: string;
}

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const createSale = useCreateSale();
  const { settings: companySettings } = useCompanySettings();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [lines, setLines] = useState<InvoiceLine[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      price: 0,
      vatRate: 21,
    },
  ]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        price: 0,
        vatRate: 21,
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length === 1) {
      toast({
        title: 'Erreur',
        description: 'Au moins une ligne est requise',
        variant: 'destructive',
      });
      return;
    }
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, updates: Partial<InvoiceLine>) => {
    setLines(
      lines.map((line) => (line.id === id ? { ...line, ...updates } : line))
    );
  };

  const selectProduct = (lineId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateLine(lineId, {
        productId,
        description: product.name,
        price: Number(product.price),
        vatRate: Number(product.vat_rate),
      });
    }
  };

  const calculateLine = (line: InvoiceLine) => {
    const subtotal = line.quantity * line.price;
    const vat = (subtotal * line.vatRate) / 100;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    const vatByRate: Record<number, number> = {};
    let total = 0;

    lines.forEach((line) => {
      const calc = calculateLine(line);
      subtotal += calc.subtotal;
      vatByRate[line.vatRate] = (vatByRate[line.vatRate] || 0) + calc.vat;
      total += calc.total;
    });

    const totalVat = Object.values(vatByRate).reduce((sum, v) => sum + v, 0);

    return { subtotal, vatByRate, totalVat, total };
  }, [lines]);

  // Validation UBL en temps réel
  const ublValidation = useMemo((): UBLValidationResult => {
    return validateUBLDocument({
      sale_number: `FAC-PREVIEW`,
      date: format(new Date(), 'yyyy-MM-dd'),
      customers: selectedCustomer ? {
        name: selectedCustomer.name,
        vat_number: selectedCustomer.vat_number,
        address: selectedCustomer.address,
        city: selectedCustomer.city,
        postal_code: selectedCustomer.postal_code,
      } : undefined,
      sale_items: lines.map(line => ({
        product_name: line.description,
        quantity: line.quantity,
        unit_price: line.price,
        vat_rate: line.vatRate,
      })),
      subtotal: totals.subtotal,
      total_vat: totals.totalVat,
      total: totals.total,
    }, {
      name: companySettings.name,
      vatNumber: companySettings.vat_number,
      address: companySettings.address,
      city: companySettings.city,
      postalCode: companySettings.postal_code,
      phone: companySettings.phone,
      email: companySettings.email,
      iban: companySettings.bank_iban,
      bic: companySettings.bank_bic,
    });
  }, [selectedCustomer, lines, totals, companySettings]);

  const handleDownloadPDF = async () => {
    // Charger les comptes bancaires depuis les settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'invoice_settings')
      .maybeSingle();
    
    const invoiceSettings = settingsData?.value as any;
    const bankAccounts = invoiceSettings?.bank_accounts || [];
    
    const invoiceData = {
      saleNumber: `FAC-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`,
      date: new Date(),
      isPaid: false,
      bankAccounts,
      company: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
        phone: companySettings.phone,
      },
      customer: selectedCustomer ? {
        name: selectedCustomer.name,
        vatNumber: selectedCustomer.vat_number,
        address: selectedCustomer.address,
        city: selectedCustomer.city,
        postalCode: selectedCustomer.postal_code,
      } : undefined,
      items: lines.map((line) => {
        const calc = calculateLine(line);
        return {
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.price,
          vatRate: line.vatRate,
          subtotal: calc.subtotal,
          vatAmount: calc.vat,
          total: calc.total,
        };
      }),
      subtotal: totals.subtotal,
      totalVat: totals.totalVat,
      total: totals.total,
      notes,
    };

    await downloadInvoicePDF(invoiceData);
    toast({
      title: 'PDF téléchargé',
      description: 'La facture a été téléchargée avec succès',
    });
  };

  const handleSave = async () => {
    if (!selectedCustomerId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un client',
        variant: 'destructive',
      });
      return;
    }

    if (lines.some((l) => !l.description || l.quantity <= 0 || l.price < 0)) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir toutes les lignes correctement',
        variant: 'destructive',
      });
      return;
    }

    // Avertissement UBL (informatif, ne bloque pas)
    if (ublValidation.errors.length > 0 || ublValidation.warnings.length > 0) {
      toast({
        title: 'Validation UBL.BE',
        description: `${ublValidation.errors.length} erreur(s), ${ublValidation.warnings.length} avertissement(s) pour l'export UBL`,
      });
    }

    setIsSaving(true);
    try {
      const saleItems = lines.map((line) => {
        const calc = calculateLine(line);
        return {
          product_id: line.productId,
          product_name: line.description,
          quantity: line.quantity,
          unit_price: line.price,
          vat_rate: line.vatRate,
          subtotal: calc.subtotal,
          vat_amount: calc.vat,
          total: calc.total,
        };
      });

      await createSale.mutateAsync({
        sale: {
          items: saleItems,
          customer_id: selectedCustomerId,
          payment_method: 'card' as const,
          is_invoice: true,
          is_cancelled: false,
          cashier_id: user?.id || '',
          subtotal: totals.subtotal,
          total_vat: totals.totalVat,
          total_discount: 0,
          total: totals.total,
          notes,
        }
      });

      toast({
        title: 'Facture créée',
        description: 'La facture a été enregistrée avec succès',
      });

      navigate('/documents');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la facture',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header Ultra Pro */}
      <div className="bg-gradient-to-r from-primary via-primary-glow to-primary border-b-4 border-primary-glow shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/documents')}
                className="text-white hover:bg-white/20 shrink-0 transition-smooth"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    Nouvelle Facture
                  </h1>
                  <p className="text-sm text-white/90">Création de facture professionnelle</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || lines.length === 0}
                className="shadow-lg hover:shadow-xl transition-smooth"
              >
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={lines.length === 0}
                className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-smooth"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* UBL Warning Alert */}
        {(ublValidation.errors.length > 0 || ublValidation.warnings.length > 0) && (
          <div className="mb-6">
            <UBLWarningAlert validation={ublValidation} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Customer Selection Card */}
            <Card className="p-6 bg-white shadow-xl border-2 border-primary/10 hover:border-primary/30 transition-smooth">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <Label className="text-base font-bold text-primary">Informations Client</Label>
              </div>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="h-11 border-2 focus:border-primary">
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {customer.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {/* Invoice Lines Card */}
            <Card className="p-6 bg-white shadow-xl border-2 border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <Label className="text-base font-bold text-primary">Articles de la Facture</Label>
                  <Badge variant="secondary" className="ml-2">{lines.length}</Badge>
                </div>
                <Button
                  onClick={addLine}
                  className="bg-primary hover:bg-primary-glow shadow-md transition-smooth"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Article
                </Button>
              </div>

              <ScrollArea className="max-h-[500px] pr-4">
                <div className="space-y-4">
                  {lines.map((line, index) => {
                    const calc = calculateLine(line);
                    return (
                      <div key={line.id} className="border-2 border-border rounded-xl p-4 bg-gradient-to-br from-white to-primary/5 hover:border-primary/30 transition-smooth shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="font-semibold">
                            Article {index + 1}
                          </Badge>
                          {lines.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLine(line.id)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive transition-smooth"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-3">
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5">Produit</Label>
                            <Select
                              value={line.productId || ''}
                              onValueChange={(value) => selectProduct(line.id, value)}
                            >
                              <SelectTrigger className="h-10 border-2 focus:border-primary">
                                <SelectValue placeholder="Sélectionner un produit" />
                              </SelectTrigger>
                              <SelectContent>
                                {products?.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{product.name}</span>
                                      <span className="ml-4 text-primary font-semibold">{Number(product.price).toFixed(2)}€</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5">Description</Label>
                            <Input
                              value={line.description}
                              onChange={(e) => updateLine(line.id, { description: e.target.value })}
                              placeholder="Description de l'article"
                              className="h-10 border-2 focus:border-primary"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5">Quantité</Label>
                              <Input
                                type="number"
                                value={line.quantity}
                                onChange={(e) => updateLine(line.id, { quantity: parseFloat(e.target.value) || 0 })}
                                min="0"
                                step="0.01"
                                className="h-10 border-2 focus:border-primary font-semibold"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-muted-foreground mb-1.5">Prix Unit. HT (€)</Label>
                              <Input
                                type="number"
                                value={line.price}
                                onChange={(e) => updateLine(line.id, { price: parseFloat(e.target.value) || 0 })}
                                min="0"
                                step="0.01"
                                className="h-10 border-2 focus:border-primary font-semibold"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground mb-1.5">Taux TVA</Label>
                            <Select
                              value={line.vatRate.toString()}
                              onValueChange={(value) => updateLine(line.id, { vatRate: parseFloat(value) })}
                            >
                              <SelectTrigger className="h-10 border-2 focus:border-primary">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0% - Exonéré</SelectItem>
                                <SelectItem value="6">6% - Taux réduit</SelectItem>
                                <SelectItem value="12">12% - Taux parking</SelectItem>
                                <SelectItem value="21">21% - Taux normal</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Separator className="my-2" />

                          <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground font-medium mb-1">Total HT</div>
                                <div className="font-bold text-sm">{calc.subtotal.toFixed(2)}€</div>
                              </div>
                              <div className="text-center border-x border-primary/20">
                                <div className="text-xs text-muted-foreground font-medium mb-1">TVA</div>
                                <div className="font-bold text-sm text-accent">{calc.vat.toFixed(2)}€</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground font-medium mb-1">Total TTC</div>
                                <div className="font-bold text-base text-primary">{calc.total.toFixed(2)}€</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>

            {/* Notes Card */}
            <Card className="p-6 bg-white shadow-xl border-2 border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-primary" />
                <Label className="text-base font-bold text-primary">Notes & Commentaires</Label>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajouter des notes, conditions de paiement, ou autres informations..."
                rows={4}
                className="border-2 focus:border-primary resize-none"
              />
            </Card>
          </div>

          {/* Right: Professional Preview */}
          <div className="lg:sticky lg:top-6 h-fit">
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

              <ScrollArea className="h-[calc(100vh-240px)]">
                <div className="p-6 space-y-6">
                  {/* Company Header */}
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border-2 border-primary/20">
                    <div className="text-xl font-bold text-primary mb-2">{companySettings.name}</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>{companySettings.address}</div>
                      <div>{companySettings.postal_code} {companySettings.city}</div>
                      <div className="font-semibold text-foreground">TVA: {companySettings.vat_number}</div>
                      {companySettings.phone && <div>Tél: {companySettings.phone}</div>}
                    </div>
                  </div>

                  {/* Invoice Info */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(), 'dd MMMM yyyy', { locale: fr })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary mb-1">FACTURE</div>
                      <Badge variant="outline" className="font-mono">
                        N° {format(new Date(), 'yyyy-MM-dd-HHmmss')}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Customer Section */}
                  {selectedCustomer ? (
                    <div className="bg-primary/5 rounded-xl p-5 border-2 border-primary/20">
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">
                        <User className="h-4 w-4" />
                        FACTURÉ À
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-lg">{selectedCustomer.name}</div>
                        {selectedCustomer.vat_number && (
                          <div className="text-sm text-muted-foreground">N° TVA: {selectedCustomer.vat_number}</div>
                        )}
                        {selectedCustomer.address && (
                          <div className="text-sm text-muted-foreground">{selectedCustomer.address}</div>
                        )}
                        {selectedCustomer.city && (
                          <div className="text-sm text-muted-foreground">
                            {selectedCustomer.postal_code} {selectedCustomer.city}
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
                      <Badge variant="secondary">{lines.length}</Badge>
                    </div>
                    
                    {lines.length > 0 ? (
                      <div className="space-y-3">
                        {lines.map((line, index) => {
                          const calc = calculateLine(line);
                          return (
                            <div key={line.id} className="border-2 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 hover:border-primary/30 transition-smooth">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                                    <span className="font-semibold text-sm">{line.description || 'Article sans nom'}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Qté: <span className="font-semibold text-foreground">{line.quantity}</span></span>
                                    <span>×</span>
                                    <span>PU HT: <span className="font-semibold text-foreground">{line.price.toFixed(2)}€</span></span>
                                    <span>TVA: <span className="font-semibold text-accent">{line.vatRate}%</span></span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-muted-foreground mb-1">Total TTC</div>
                                  <div className="text-lg font-bold text-primary">{calc.total.toFixed(2)}€</div>
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

                  <Separator />

                  {/* Totals Section */}
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border-2 border-primary/20">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Total HT:</span>
                        <span className="text-base font-bold">{totals.subtotal.toFixed(2)}€</span>
                      </div>
                      
                      {Object.entries(totals.vatByRate).map(([rate, amount]) => (
                        <div key={rate} className="flex justify-between items-center">
                          <span className="text-sm font-medium text-muted-foreground">TVA {rate}%:</span>
                          <span className="text-base font-semibold text-accent">{amount.toFixed(2)}€</span>
                        </div>
                      ))}
                      
                      <Separator className="bg-primary/20" />
                      
                      <div className="flex justify-between items-center bg-primary text-white rounded-lg p-4 shadow-lg">
                        <div className="flex items-center gap-2">
                          <Euro className="h-6 w-6" />
                          <span className="text-lg font-bold">Total TTC:</span>
                        </div>
                        <span className="text-2xl font-bold">{totals.total.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  {notes && (
                    <>
                      <Separator />
                      <div className="bg-primary/5 rounded-xl p-5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h4 className="text-sm font-bold text-primary">Notes</h4>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
