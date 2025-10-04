import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileBarChart2, BarChart3, FileText, ShoppingCart, TrendingUp, TrendingDown, Calendar, DollarSign, CreditCard, Smartphone, Printer, PieChart, Clock } from 'lucide-react';
import { useDailyReports } from '@/hooks/useDailyReports';
import { useAnalytics, useComparativeAnalytics } from '@/hooks/useAnalytics';
import { QuotesTab } from '@/components/orders/QuotesTab';
import { CustomerOrdersTab } from '@/components/orders/CustomerOrdersTab';
import { OrdersStatsCards } from '@/components/orders/OrdersStatsCards';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReportZContent } from '@/components/pos/ReportZContent';
import { printReportZ } from '@/components/pos/CloseDayDialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const ReportsAnalytics = () => {
  const [activeTab, setActiveTab] = useState('reports');

  // Reports state
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const { data: reports = [], isLoading: reportsLoading } = useDailyReports();

  // Analytics state
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(period);
  const { data: comparative } = useComparativeAnalytics();

  const handleViewReport = (report: any) => {
    const reportData = {
      totalSales: report.total_sales,
      totalCash: report.total_cash,
      totalCard: report.total_card,
      totalMobile: report.total_mobile,
      salesCount: report.sales_count,
      vatByRate: {},
    };

    const todayReport = {
      id: report.id,
      report_date: report.report_date,
      opening_amount: report.opening_amount,
      closing_amount: report.closing_amount,
      total_sales: report.total_sales,
      total_cash: report.total_cash,
      total_card: report.total_card,
      total_mobile: report.total_mobile,
      sales_count: report.sales_count,
      cashier_id: report.cashier_id,
      serial_number: report.serial_number,
      created_at: report.created_at,
    };

    setSelectedReport({
      reportData,
      todayReport,
      closingAmount: report.closing_amount,
      difference: report.closing_amount - (report.opening_amount + report.total_cash),
    });
    setReportDialogOpen(true);
  };

  const getTotals = () => {
    const totalSales = reports.reduce((sum, r) => sum + r.total_sales, 0);
    const totalCash = reports.reduce((sum, r) => sum + r.total_cash, 0);
    const totalCard = reports.reduce((sum, r) => sum + r.total_card, 0);
    const totalMobile = reports.reduce((sum, r) => sum + r.total_mobile, 0);
    return { totalSales, totalCash, totalCard, totalMobile };
  };

  const { totalSales, totalCash, totalCard, totalMobile } = getTotals();

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-3 md:px-6">
      <div>
        <h1 className="text-3xl font-bold">Analyses & Rapports</h1>
        <p className="text-muted-foreground">
          Rapports Z, analyses de ventes et commandes clients
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="gap-2">
            <FileBarChart2 className="h-4 w-4" />
            Rapports Z
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analyses
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Commandes & Devis
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-to-br from-destructive to-destructive/80 text-white border-0 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-white/80 text-sm font-medium">Total Général</p>
                  <p className="text-3xl font-black">{totalSales.toFixed(2)}€</p>
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    <span>{reports.length} rapports</span>
                  </div>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-accent to-accent/80 text-white border-0 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-white/80 text-sm font-medium">Espèces</p>
                  <p className="text-3xl font-black">{totalCash.toFixed(2)}€</p>
                  <p className="text-white/60 text-xs">{((totalCash / totalSales) * 100 || 0).toFixed(1)}% du total</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-category-blue to-category-blue/80 text-white border-0 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-white/80 text-sm font-medium">Carte Bancaire</p>
                  <p className="text-3xl font-black">{totalCard.toFixed(2)}€</p>
                  <p className="text-white/60 text-xs">{((totalCard / totalSales) * 100 || 0).toFixed(1)}% du total</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <CreditCard className="h-6 w-6" />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-category-purple to-category-purple/80 text-white border-0 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-white/80 text-sm font-medium">Paiement Mobile</p>
                  <p className="text-3xl font-black">{totalMobile.toFixed(2)}€</p>
                  <p className="text-white/60 text-xs">{((totalMobile / totalSales) * 100 || 0).toFixed(1)}% du total</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <Smartphone className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6 border-b bg-gradient-to-r from-muted/30 to-muted/10">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-destructive" />
                <div>
                  <h2 className="text-xl font-bold">Liste des Rapports</h2>
                  <p className="text-sm text-muted-foreground">{reports.length} rapports enregistrés</p>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-520px)]">
              <div className="p-6 space-y-3">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className="p-5 border-2 hover:border-destructive/30 hover:shadow-lg transition-all duration-100 cursor-pointer"
                    onClick={() => handleViewReport(report)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-destructive/10 rounded-lg">
                          <Calendar className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-bold">
                            {format(new Date(report.report_date), 'EEEE dd MMMM yyyy', { locale: fr })}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{report.sales_count} ventes</span>
                            <span>•</span>
                            <span>Ouverture: {report.opening_amount.toFixed(2)}€</span>
                            {report.closing_amount && (
                              <>
                                <span>•</span>
                                <span>Clôture: {report.closing_amount.toFixed(2)}€</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Espèces</p>
                            <p className="text-sm font-bold text-accent">{report.total_cash.toFixed(2)}€</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Carte</p>
                            <p className="text-sm font-bold text-category-blue">{report.total_card.toFixed(2)}€</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Mobile</p>
                            <p className="text-sm font-bold text-category-purple">{report.total_mobile.toFixed(2)}€</p>
                          </div>
                        </div>

                        <div className="text-right space-y-1 min-w-[120px]">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-2xl font-black text-destructive">{report.total_sales.toFixed(2)}€</p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-12 w-12"
                          disabled={!report.closing_amount}
                        >
                          <FileText className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {reports.length === 0 && (
                  <div className="text-center py-16">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl font-semibold text-muted-foreground">Aucun rapport trouvé</p>
                    <p className="text-sm text-muted-foreground mt-2">Les rapports de clôture apparaîtront ici</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>

          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogContent className="max-w-sm bg-white border-2 border-destructive p-0">
              <DialogHeader className="p-4 pb-0">
                <DialogTitle className="text-destructive font-bold text-center">RAPPORT Z - CLOTURE FISCALE</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                {selectedReport && (
                  <ReportZContent
                    reportData={selectedReport.reportData}
                    todayReport={selectedReport.todayReport}
                    closingAmount={selectedReport.closingAmount}
                    difference={selectedReport.difference}
                  />
                )}
              </ScrollArea>
              <div className="p-4 border-t bg-muted/30 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReportDialogOpen(false);
                    setSelectedReport(null);
                  }}
                  className="flex-1 h-12 font-semibold"
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    printReportZ();
                  }}
                  className="flex-1 h-12 bg-destructive hover:bg-destructive/90 text-white font-bold"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  IMPRIMER
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-end">
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Nombre de ventes</CardDescription>
                <CardTitle className="text-3xl">{analytics?.totalSales || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Chiffre d'affaires</CardDescription>
                <CardTitle className="text-3xl">{analytics?.totalRevenue.toFixed(2)}€</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Panier moyen</CardDescription>
                <CardTitle className="text-3xl">{analytics?.averageBasket.toFixed(2)}€</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Croissance semaine</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  {comparative?.week.growth.toFixed(1)}%
                  {comparative && comparative.week.growth > 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="products">
                <PieChart className="h-4 w-4 mr-2" />
                Produits
              </TabsTrigger>
              <TabsTrigger value="time">
                <Clock className="h-4 w-4 mr-2" />
                Temps
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="h-4 w-4 mr-2" />
                Paiements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ventes par jour</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics?.salesByDay || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8B5CF6" name="CA (€)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ventes par catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RPieChart>
                        <Pie
                          data={analytics?.salesByCategory || []}
                          dataKey="revenue"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {analytics?.salesByCategory.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Méthodes de paiement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RPieChart>
                        <Pie
                          data={analytics?.salesByPaymentMethod || []}
                          dataKey="amount"
                          nameKey="method"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {analytics?.salesByPaymentMethod.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 produits</CardTitle>
                  <CardDescription>Les produits les plus vendus</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analytics?.topProducts || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8B5CF6" name="CA (€)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="time">
              <Card>
                <CardHeader>
                  <CardTitle>Ventes par heure</CardTitle>
                  <CardDescription>Distribution des ventes sur la journée</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics?.salesByHour || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} />
                      <YAxis />
                      <Tooltip labelFormatter={(h) => `${h}h00`} />
                      <Line type="monotone" dataKey="sales" stroke="#8B5CF6" name="Ventes" />
                      <Line type="monotone" dataKey="revenue" stroke="#06B6D4" name="CA (€)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par paiement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.salesByPaymentMethod.map((method, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{method.method}</span>
                            <span>{method.amount.toFixed(2)}€</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full"
                              style={{
                                width: `${(method.amount / analytics.totalRevenue) * 100}%`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Nombre de transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analytics?.salesByPaymentMethod || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="method" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8B5CF6" name="Transactions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <OrdersStatsCards />

          <Tabs defaultValue="quotes" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quotes" className="gap-2">
                <FileText className="h-4 w-4" />
                Devis
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Commandes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quotes">
              <QuotesTab />
            </TabsContent>

            <TabsContent value="orders">
              <CustomerOrdersTab />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsAnalytics;
