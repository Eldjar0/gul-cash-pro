import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  Calendar,
  Euro,
  User,
  Eye,
  Download,
  Plus,
  TrendingUp,
  CreditCard,
  FileBarChart2,
  Building2,
} from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { downloadInvoicePDF, previewInvoicePDF } from '@/utils/generateInvoicePDF';
import { useCompanySettings } from '@/hooks/useCompanySettings';

export default function Invoices() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: sales = [], isLoading } = useSales();
  const { settings: companySettings } = useCompanySettings();

  const invoices = sales.filter(sale => sale.is_invoice);

  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      invoice.sale_number?.toLowerCase().includes(searchLower) ||
      invoice.customers?.name?.toLowerCase().includes(searchLower) ||
      format(new Date(invoice.date), 'dd/MM/yyyy').includes(searchLower)
    );
  });

  const handleViewInvoice = (sale: any) => {
    const invoiceData = {
      saleNumber: sale.sale_number,
      date: new Date(sale.date),
      company: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
        phone: companySettings.phone,
      },
      customer: sale.customers ? {
        name: sale.customers.name,
        vatNumber: sale.customers.vat_number,
        address: sale.customers.address,
        city: sale.customers.city,
        postalCode: sale.customers.postal_code,
      } : undefined,
      items: sale.sale_items?.map((item: any) => ({
        description: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        vatRate: item.vat_rate,
        subtotal: item.subtotal,
        vatAmount: item.vat_amount,
        total: item.total,
      })) || [],
      subtotal: sale.subtotal,
      totalVat: sale.total_vat,
      total: sale.total,
      notes: sale.notes,
    };

    previewInvoicePDF(invoiceData);
  };

  const handleDownloadInvoice = (sale: any) => {
    const invoiceData = {
      saleNumber: sale.sale_number,
      date: new Date(sale.date),
      company: {
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        postalCode: companySettings.postal_code,
        vatNumber: companySettings.vat_number,
        phone: companySettings.phone,
      },
      customer: sale.customers ? {
        name: sale.customers.name,
        vatNumber: sale.customers.vat_number,
        address: sale.customers.address,
        city: sale.customers.city,
        postalCode: sale.customers.postal_code,
      } : undefined,
      items: sale.sale_items?.map((item: any) => ({
        description: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        vatRate: item.vat_rate,
        subtotal: item.subtotal,
        vatAmount: item.vat_amount,
        total: item.total,
      })) || [],
      subtotal: sale.subtotal,
      totalVat: sale.total_vat,
      total: sale.total,
      notes: sale.notes,
    };

    downloadInvoicePDF(invoiceData);
  };

  const getStats = () => {
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalHT = filteredInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalTVA = filteredInvoices.reduce((sum, inv) => sum + inv.total_vat, 0);
    const uniqueClients = new Set(filteredInvoices.filter(i => i.customer_id).map(i => i.customer_id)).size;
    const thisMonth = filteredInvoices.filter(inv => {
      const invDate = new Date(inv.date);
      const now = new Date();
      return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
    });
    const monthAmount = thisMonth.reduce((sum, inv) => sum + inv.total, 0);
    
    return { totalAmount, totalHT, totalTVA, totalCount: filteredInvoices.length, uniqueClients, monthCount: thisMonth.length, monthAmount };
  };

  const { totalAmount, totalHT, totalTVA, totalCount, uniqueClients, monthCount, monthAmount } = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground font-medium">Chargement des factures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Title & Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-foreground">Factures Clients</h1>
                <p className="text-muted-foreground text-lg">{totalCount} factures émises</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate('/invoices/create')}
            size="lg"
            className="h-12 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-5 w-5 mr-2" />
            Créer Facture
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-primary to-primary-glow text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Total TTC</p>
                <p className="text-3xl font-black">{totalAmount.toFixed(2)}€</p>
                <div className="flex items-center gap-1 text-white/60 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  <span>{totalCount} factures</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Euro className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-accent to-accent/80 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Total HT</p>
                <p className="text-3xl font-black">{totalHT.toFixed(2)}€</p>
                <p className="text-white/60 text-xs">TVA: {totalTVA.toFixed(2)}€</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <FileBarChart2 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-category-blue to-category-blue/80 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Clients Facturés</p>
                <p className="text-3xl font-black">{uniqueClients}</p>
                <p className="text-white/60 text-xs">Clients uniques</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Building2 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-category-purple to-category-purple/80 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-white/80 text-sm font-medium">Ce Mois</p>
                <p className="text-3xl font-black">{monthAmount.toFixed(2)}€</p>
                <p className="text-white/60 text-xs">{monthCount} factures</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4 bg-white border-0 shadow-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro de facture, client ou date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>
        </Card>

        {/* Invoices List */}
        <Card className="bg-white border-0 shadow-xl overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-muted/30 to-muted/10">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Liste des Factures</h2>
                <p className="text-sm text-muted-foreground">{filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''} trouvée{filteredInvoices.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-520px)]">
            <div className="p-6 space-y-3">
              {filteredInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="p-5 border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-100 bg-gradient-to-r from-white to-muted/20"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-base px-3 py-1">
                            {invoice.sale_number}
                          </Badge>
                          <Badge className="bg-primary/10 text-primary border-0">
                            Facture
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {format(new Date(invoice.date), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>

                        {invoice.customers && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-semibold text-foreground">{invoice.customers.name}</p>
                              {invoice.customers.vat_number && (
                                <p className="text-xs text-muted-foreground">TVA: {invoice.customers.vat_number}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-right space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total HT</p>
                          <p className="text-lg font-bold">{invoice.subtotal.toFixed(2)}€</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">TVA</p>
                          <p className="text-sm font-semibold text-accent">{invoice.total_vat.toFixed(2)}€</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total TTC</p>
                          <p className="text-2xl font-black text-primary">{invoice.total.toFixed(2)}€</p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{invoice.sale_items?.length || 0} article{(invoice.sale_items?.length || 0) > 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>
                          {invoice.payment_method === 'cash' && '💵 Espèces'}
                          {invoice.payment_method === 'card' && '💳 Carte'}
                          {invoice.payment_method === 'mobile' && '📱 Mobile'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                          className="h-9"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                        <Button 
                          variant="default"
                          size="sm" 
                          className="h-9"
                          onClick={() => handleDownloadInvoice(invoice)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {filteredInvoices.length === 0 && (
                <div className="text-center py-16">
                  <div className="inline-flex p-6 bg-muted/30 rounded-full mb-4">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-semibold text-muted-foreground">Aucune facture trouvée</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchTerm ? 'Essayez de modifier votre recherche' : 'Créez votre première facture'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
