import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileText,
  Download,
  Eye,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { useCreateSale } from '@/hooks/useSales';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  productId?: string;
}

const VAT_RATES = [0, 6, 12, 21];

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      unitPrice: 0,
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
        unitPrice: 0,
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

  const updateLine = (id: string, field: keyof InvoiceLine, value: any) => {
    setLines(
      lines.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const selectProduct = (lineId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setLines(
        lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                productId,
                description: product.name,
                unitPrice: Number(product.price),
                vatRate: Number(product.vat_rate),
              }
            : line
        )
      );
    }
  };

  const calculateLine = (line: InvoiceLine) => {
    const ht = line.quantity * line.unitPrice;
    const vat = (ht * line.vatRate) / 100;
    const ttc = ht + vat;
    return { ht, vat, ttc };
  };

  const calculateTotals = () => {
    let totalHT = 0;
    const vatByRate: Record<number, number> = {};
    let totalTTC = 0;

    lines.forEach((line) => {
      const { ht, vat, ttc } = calculateLine(line);
      totalHT += ht;
      vatByRate[line.vatRate] = (vatByRate[line.vatRate] || 0) + vat;
      totalTTC += ttc;
    });

    const totalVAT = Object.values(vatByRate).reduce((sum, v) => sum + v, 0);

    return { totalHT, vatByRate, totalVAT, totalTTC };
  };

  const { totalHT, vatByRate, totalVAT, totalTTC } = calculateTotals();

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Company Info
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companySettings.name, 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companySettings.address, 20, yPos);
    yPos += 5;
    doc.text(`${companySettings.postal_code} ${companySettings.city}`, 20, yPos);
    yPos += 5;
    doc.text(`TVA: ${companySettings.vat_number}`, 20, yPos);
    if (companySettings.phone) {
      yPos += 5;
      doc.text(`Tél: ${companySettings.phone}`, 20, yPos);
    }

    // Invoice Title & Number
    yPos = 20;
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', pageWidth - 20, yPos, { align: 'right' });
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const invoiceNumber = `FAC-${format(new Date(), 'yyyy')}-XXXX`;
    doc.text(invoiceNumber, pageWidth - 20, yPos, { align: 'right' });
    yPos += 5;
    doc.text(format(new Date(), 'dd/MM/yyyy', { locale: fr }), pageWidth - 20, yPos, { align: 'right' });

    // Customer Info
    yPos = 60;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Client:', 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (selectedCustomer) {
      doc.text(selectedCustomer.name, 20, yPos);
      if (selectedCustomer.vat_number) {
        yPos += 5;
        doc.text(`TVA: ${selectedCustomer.vat_number}`, 20, yPos);
      }
      if (selectedCustomer.address) {
        yPos += 5;
        doc.text(selectedCustomer.address, 20, yPos);
      }
      if (selectedCustomer.city) {
        yPos += 5;
        doc.text(`${selectedCustomer.postal_code || ''} ${selectedCustomer.city}`, 20, yPos);
      }
    }

    // Items Table
    yPos = 100;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    // Table Header
    doc.text('Description', 20, yPos);
    doc.text('Qté', 100, yPos, { align: 'right' });
    doc.text('PU HT', 125, yPos, { align: 'right' });
    doc.text('TVA', 145, yPos, { align: 'right' });
    doc.text('Total TTC', 180, yPos, { align: 'right' });
    yPos += 2;
    doc.line(20, yPos, 190, yPos);
    yPos += 5;

    // Table Rows
    doc.setFont('helvetica', 'normal');
    lines.forEach((line) => {
      const { ht, vat, ttc } = calculateLine(line);
      
      doc.text(line.description.substring(0, 40), 20, yPos);
      doc.text(line.quantity.toString(), 100, yPos, { align: 'right' });
      doc.text(`${line.unitPrice.toFixed(2)}€`, 125, yPos, { align: 'right' });
      doc.text(`${line.vatRate}%`, 145, yPos, { align: 'right' });
      doc.text(`${ttc.toFixed(2)}€`, 180, yPos, { align: 'right' });
      yPos += 6;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });

    // Totals
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Total HT:', 130, yPos);
    doc.text(`${totalHT.toFixed(2)}€`, 180, yPos, { align: 'right' });
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    Object.entries(vatByRate).forEach(([rate, amount]) => {
      doc.text(`TVA ${rate}%:`, 130, yPos);
      doc.text(`${amount.toFixed(2)}€`, 180, yPos, { align: 'right' });
      yPos += 6;
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total TTC:', 130, yPos);
    doc.text(`${totalTTC.toFixed(2)}€`, 180, yPos, { align: 'right' });

    // Notes
    if (notes) {
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(notes, 170);
      doc.text(splitNotes, 20, yPos);
    }

    return doc;
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    doc.save(`facture-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`);
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

    if (lines.some((l) => !l.description || l.quantity <= 0 || l.unitPrice < 0)) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir toutes les lignes correctement',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const saleItems = lines.map((line) => {
        const { ht, vat, ttc } = calculateLine(line);
        return {
          product_id: line.productId,
          product_name: line.description,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          vat_rate: line.vatRate,
          subtotal: ht,
          vat_amount: vat,
          total: ttc,
        };
      });

      await createSale.mutateAsync({
        items: saleItems,
        customer_id: selectedCustomerId,
        payment_method: 'card',
        is_invoice: true,
        is_cancelled: false,
        subtotal: totalHT,
        total_vat: totalVAT,
        total_discount: 0,
        total: totalTTC,
        notes,
      });

      toast({
        title: 'Facture créée',
        description: 'La facture a été enregistrée avec succès',
      });

      navigate('/invoices');
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b border-primary/20 px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/invoices')}
              className="text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white">Nouvelle Facture</h1>
              <p className="text-xs md:text-sm text-white/80">Créer une facture manuelle</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={!selectedCustomerId || lines.some((l) => !l.description)}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !selectedCustomerId}
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6 max-w-[1600px] mx-auto">
        {/* Form Section */}
        <div className="space-y-4">
          {/* Customer Selection */}
          <Card className="p-4 md:p-6 bg-white shadow-sm">
            <Label className="text-sm font-semibold mb-2 block">Client *</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} {customer.vat_number && `(${customer.vat_number})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Invoice Lines */}
          <Card className="p-4 md:p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-semibold">Articles</Label>
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" />
                Ligne
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {lines.map((line, index) => {
                  const lineCalc = calculateLine(line);
                  return (
                    <div key={line.id} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length === 1}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Produit</Label>
                          <Select
                            value={line.productId || ''}
                            onValueChange={(value) => selectProduct(line.id, value)}
                          >
                            <SelectTrigger className="h-9 bg-white">
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} - {Number(product.price).toFixed(2)}€
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">Description</Label>
                          <Input
                            value={line.description}
                            onChange={(e) =>
                              updateLine(line.id, 'description', e.target.value)
                            }
                            placeholder="Description..."
                            className="h-9 bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Qté</Label>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={line.quantity}
                              onChange={(e) =>
                                updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)
                              }
                              className="h-9 bg-white"
                            />
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">PU HT</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) =>
                                updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
                              className="h-9 bg-white"
                            />
                          </div>

                          <div>
                            <Label className="text-xs text-muted-foreground">TVA</Label>
                            <Select
                              value={line.vatRate.toString()}
                              onValueChange={(value) =>
                                updateLine(line.id, 'vatRate', parseInt(value))
                              }
                            >
                              <SelectTrigger className="h-9 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {VAT_RATES.map((rate) => (
                                  <SelectItem key={rate} value={rate.toString()}>
                                    {rate}%
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Total TTC:</span>
                            <span className="font-bold text-primary">{lineCalc.ttc.toFixed(2)}€</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>

          {/* Notes */}
          <Card className="p-4 md:p-6 bg-white shadow-sm">
            <Label className="text-sm font-semibold mb-2 block">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conditions de paiement, remarques..."
              rows={3}
              className="resize-none"
            />
          </Card>
        </div>

        {/* Preview Section */}
        <div className="lg:sticky lg:top-4 h-fit">
          <Card className="p-6 bg-white shadow-lg">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Prévisualisation</h2>
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-6 pr-4">
                {/* Company Header */}
                <div className="border-b pb-4">
                  <h3 className="text-xl font-bold text-primary">{companySettings.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{companySettings.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {companySettings.postal_code} {companySettings.city}
                  </p>
                  <p className="text-sm text-muted-foreground">TVA: {companySettings.vat_number}</p>
                  {companySettings.phone && (
                    <p className="text-sm text-muted-foreground">Tél: {companySettings.phone}</p>
                  )}
                </div>

                {/* Invoice Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-2">FACTURE</h2>
                    <p className="text-sm text-muted-foreground">
                      N°: FAC-{format(new Date(), 'yyyy')}-XXXX
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Date: {format(new Date(), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                {selectedCustomer && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">CLIENT</p>
                    <p className="font-semibold">{selectedCustomer.name}</p>
                    {selectedCustomer.vat_number && (
                      <p className="text-sm text-muted-foreground">TVA: {selectedCustomer.vat_number}</p>
                    )}
                    {selectedCustomer.address && (
                      <p className="text-sm text-muted-foreground">{selectedCustomer.address}</p>
                    )}
                    {selectedCustomer.city && (
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomer.postal_code} {selectedCustomer.city}
                      </p>
                    )}
                  </div>
                )}

                {/* Items Table */}
                <div>
                  <div className="border-b pb-2 mb-3 grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2 text-right">Qté</div>
                    <div className="col-span-2 text-right">PU HT</div>
                    <div className="col-span-3 text-right">Total TTC</div>
                  </div>

                  <div className="space-y-2">
                    {lines.map((line) => {
                      const calc = calculateLine(line);
                      return (
                        <div key={line.id} className="grid grid-cols-12 gap-2 text-sm py-2 border-b border-dashed">
                          <div className="col-span-5">
                            <p className="font-medium">{line.description || '...'}</p>
                            <p className="text-xs text-muted-foreground">TVA {line.vatRate}%</p>
                          </div>
                          <div className="col-span-2 text-right">{line.quantity}</div>
                          <div className="col-span-2 text-right">{line.unitPrice.toFixed(2)}€</div>
                          <div className="col-span-3 text-right font-semibold">{calc.ttc.toFixed(2)}€</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total HT:</span>
                    <span className="font-semibold">{totalHT.toFixed(2)}€</span>
                  </div>
                  {Object.entries(vatByRate).map(([rate, amount]) => (
                    <div key={rate} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TVA {rate}%:</span>
                      <span>{amount.toFixed(2)}€</span>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-primary">
                    <span>Total TTC:</span>
                    <span>{totalTTC.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Notes */}
                {notes && (
                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">NOTES</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
