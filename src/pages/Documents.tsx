import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  FileBarChart, 
  ShoppingCart, 
  RotateCcw,
  Search, 
  Calendar,
  Euro,
  User,
  Eye,
  Download,
  Plus,
  TrendingUp,
  Building2,
  ArrowLeft
} from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useQuotes } from '@/hooks/useQuotes';
import { useCustomerOrders } from '@/hooks/useCustomerOrders';
import { useRefunds } from '@/hooks/useRefunds';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { downloadInvoicePDF, previewInvoicePDF } from '@/utils/generateInvoicePDF';

export default function Documents() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { settings: companySettings } = useCompanySettings();
  
  // Data hooks
  const { data: sales = [] } = useSales();
  const { data: quotes = [] } = useQuotes();
  const { data: orders = [] } = useCustomerOrders();
  const { data: refunds = [] } = useRefunds();

  const invoices = sales.filter(sale => sale.is_invoice);

  // Filter functions
  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchTerm.toLowerCase();
    return (
      invoice.sale_number?.toLowerCase().includes(searchLower) ||
      invoice.customers?.name?.toLowerCase().includes(searchLower) ||
      format(new Date(invoice.date), 'dd/MM/yyyy').includes(searchLower)
    );
  });

  const filteredQuotes = quotes.filter(quote => {
    const searchLower = searchTerm.toLowerCase();
    return (
      quote.quote_number?.toLowerCase().includes(searchLower)
    );
  });

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(searchLower)
    );
  });

  const filteredRefunds = refunds.filter(refund => {
    const searchLower = searchTerm.toLowerCase();
    return (
      refund.refund_number?.toLowerCase().includes(searchLower) ||
      refund.reason?.toLowerCase().includes(searchLower) ||
      refund.customers?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Invoice handlers
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'sent':
        return <Badge variant="outline">Envoyé</Badge>;
      case 'accepted':
        return <Badge className="bg-green-500">Accepté</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Refusé</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'ready':
        return <Badge className="bg-blue-500">Prêt</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b border-primary/20 px-4 md:px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Documents Commerciaux</h1>
            <p className="text-sm text-white/80">Factures, devis, commandes et remboursements</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Search Bar */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="h-4 w-4" />
              Factures
              <Badge variant="secondary" className="ml-2">{filteredInvoices.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="quotes" className="gap-2">
              <FileBarChart className="h-4 w-4" />
              Devis
              <Badge variant="secondary" className="ml-2">{filteredQuotes.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commandes
              <Badge variant="secondary" className="ml-2">{filteredOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="refunds" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Remboursements
              <Badge variant="secondary" className="ml-2">{filteredRefunds.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Factures
                    </CardTitle>
                    <CardDescription>Liste de toutes les factures émises</CardDescription>
                  </div>
                  <Button onClick={() => navigate('/invoices/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle facture
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {filteredInvoices.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune facture trouvée</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredInvoices.map(invoice => (
                        <Card key={invoice.id} className="hover:shadow-md transition-all duration-300 border-l-4 border-l-primary">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-lg">{invoice.sale_number}</h3>
                                  <Badge variant="outline">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(invoice.date), 'dd/MM/yyyy')}
                                  </Badge>
                                </div>
                                {invoice.customers && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {invoice.customers.name}
                                  </p>
                                )}
                                <p className="text-xl font-bold text-primary flex items-center gap-2">
                                  <Euro className="h-5 w-5" />
                                  {invoice.total.toFixed(2)}€
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </Button>
                                <Button variant="default" size="sm" onClick={() => handleDownloadInvoice(invoice)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  PDF
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5 text-primary" />
                  Devis
                </CardTitle>
                <CardDescription>Gestion des devis clients</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {filteredQuotes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun devis trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredQuotes.map(quote => (
                        <Card key={quote.id} className="hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-lg">{quote.quote_number}</h3>
                                  {getStatusBadge(quote.status)}
                                  <Badge variant="outline">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(quote.quote_date), 'dd/MM/yyyy')}
                                  </Badge>
                                </div>
                                <p className="text-xl font-bold text-blue-600 flex items-center gap-2">
                                  <Euro className="h-5 w-5" />
                                  {quote.total.toFixed(2)}€
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Commandes Clients
                </CardTitle>
                <CardDescription>Suivi des commandes en cours</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune commande trouvée</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map(order => (
                        <Card key={order.id} className="hover:shadow-md transition-all duration-300 border-l-4 border-l-green-500">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-lg">{order.order_number}</h3>
                                  {getStatusBadge(order.status)}
                                  <Badge variant="outline">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(order.order_date), 'dd/MM/yyyy')}
                                  </Badge>
                                </div>
                                <p className="text-xl font-bold text-green-600 flex items-center gap-2">
                                  <Euro className="h-5 w-5" />
                                  {order.total.toFixed(2)}€
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value="refunds">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-primary" />
                  Remboursements
                </CardTitle>
                <CardDescription>Historique des remboursements</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {filteredRefunds.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun remboursement trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredRefunds.map(refund => (
                        <Card key={refund.id} className="hover:shadow-md transition-all duration-300 border-l-4 border-l-orange-500">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-lg">{refund.refund_number}</h3>
                                  <Badge variant="outline">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(refund.created_at), 'dd/MM/yyyy')}
                                  </Badge>
                                </div>
                                {refund.customers && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {refund.customers.name}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground">Raison: {refund.reason}</p>
                                <p className="text-xl font-bold text-orange-600 flex items-center gap-2">
                                  <RotateCcw className="h-5 w-5" />
                                  {refund.total.toFixed(2)}€
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
