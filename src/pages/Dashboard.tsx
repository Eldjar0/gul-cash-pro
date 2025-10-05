import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  ShoppingCart, 
  Users, 
  Package,
  CreditCard,
  Banknote,
  Smartphone,
  Clock,
  BarChart3,
  PieChart,
  FileBarChart2,
  Printer,
  Eye,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useDailyReports } from '@/hooks/useDailyReports';
import { useAnalytics, useComparativeAnalytics } from '@/hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReportZContent } from '@/components/pos/ReportZContent';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#3B82F6', '#14B8A6'];

export default function DashboardNew() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Data hooks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { data: todaySales = [] } = useSales(today, tomorrow);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const { data: yesterdaySales = [] } = useSales(yesterday, today);
  
  const { data: products = [] } = useProducts();
  const { data: reports = [] } = useDailyReports();
  const { data: analytics } = useAnalytics(period);
  const { data: comparative } = useComparativeAnalytics();

  // Calculations
  const todayTotal = todaySales.filter(s => !s.is_cancelled).reduce((sum, s) => sum + s.total, 0);
  const yesterdayTotal = yesterdaySales.filter(s => !s.is_cancelled).reduce((sum, s) => sum + s.total, 0);
  const todayCount = todaySales.filter(s => !s.is_cancelled).length;
  const yesterdayCount = yesterdaySales.filter(s => !s.is_cancelled).length;
  
  const totalPercentChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;
  const countPercentChange = yesterdayCount > 0 ? ((todayCount - yesterdayCount) / yesterdayCount) * 100 : 0;
  const avgBasket = todayCount > 0 ? todayTotal / todayCount : 0;

  // Stock alerts
  const lowStockProducts = products.filter(p => p.stock !== null && p.min_stock !== null && p.stock <= p.min_stock && p.is_active);
  const outOfStockProducts = products.filter(p => p.stock !== null && p.stock <= 0 && p.is_active);

  // Payment methods breakdown
  const paymentMethods = {
    cash: todaySales.filter(s => !s.is_cancelled && s.payment_method === 'cash').reduce((sum, s) => sum + s.total, 0),
    card: todaySales.filter(s => !s.is_cancelled && s.payment_method === 'card').reduce((sum, s) => sum + s.total, 0),
    mobile: todaySales.filter(s => !s.is_cancelled && s.payment_method === 'mobile').reduce((sum, s) => sum + s.total, 0),
  };

  // Hourly sales for today
  const hourlySales = Array.from({ length: 24 }, (_, hour) => {
    const hourSales = todaySales.filter(s => {
      const saleHour = new Date(s.date).getHours();
      return saleHour === hour && !s.is_cancelled;
    });
    return {
      hour: `${hour}h`,
      ventes: hourSales.length,
      montant: hourSales.reduce((sum, s) => sum + s.total, 0),
    };
  }).filter(h => h.ventes > 0);

  // Top products today
  const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
  todaySales.filter(s => !s.is_cancelled).forEach(sale => {
    sale.sale_items?.forEach((item: any) => {
      const current = productSales.get(item.product_id) || { name: item.product_name, quantity: 0, revenue: 0 };
      productSales.set(item.product_id, {
        name: item.product_name,
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + item.total,
      });
    });
  });
  const topProducts = Array.from(productSales.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Payment methods chart data
  const paymentData = [
    { name: 'Espèces', value: paymentMethods.cash, color: COLORS[0] },
    { name: 'Carte', value: paymentMethods.card, color: COLORS[1] },
    { name: 'Mobile', value: paymentMethods.mobile, color: COLORS[2] },
  ].filter(p => p.value > 0);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Tableau de Bord
            </h1>
            <p className="text-muted-foreground">Vue d'ensemble de votre activité en temps réel</p>
          </div>
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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="overview" className="gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 text-sm">
              <FileBarChart2 className="h-4 w-4" />
              Rapports Z
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 text-sm">
              <PieChart className="h-4 w-4" />
              Analyses
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Main KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-primary hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium">Chiffre d'affaires</CardDescription>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Euro className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">{todayTotal.toFixed(2)}€</div>
                    <div className="flex items-center gap-2 text-sm">
                      {totalPercentChange >= 0 ? (
                        <>
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 font-medium">+{totalPercentChange.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                          <span className="text-red-500 font-medium">{totalPercentChange.toFixed(1)}%</span>
                        </>
                      )}
                      <span className="text-muted-foreground">vs hier</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium">Ventes</CardDescription>
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">{todayCount}</div>
                    <div className="flex items-center gap-2 text-sm">
                      {countPercentChange >= 0 ? (
                        <>
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 font-medium">+{countPercentChange.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                          <span className="text-red-500 font-medium">{countPercentChange.toFixed(1)}%</span>
                        </>
                      )}
                      <span className="text-muted-foreground">vs hier</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium">Panier moyen</CardDescription>
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">{avgBasket.toFixed(2)}€</div>
                    <div className="text-sm text-muted-foreground">
                      {todayCount} transaction{todayCount > 1 ? 's' : ''}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium">Alertes Stock</CardDescription>
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">{lowStockProducts.length + outOfStockProducts.length}</div>
                    <div className="flex items-center gap-2 text-sm">
                      {outOfStockProducts.length > 0 ? (
                        <Badge variant="destructive" className="text-xs">{outOfStockProducts.length} ruptures</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" /> OK</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Hourly Sales Chart */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Ventes par heure
                  </CardTitle>
                  <CardDescription>Répartition des ventes aujourd'hui</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={hourlySales}>
                      <defs>
                        <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hour" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area type="monotone" dataKey="montant" stroke={COLORS[0]} fillOpacity={1} fill="url(#colorVentes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Methods Chart */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Moyens de paiement
                  </CardTitle>
                  <CardDescription>Répartition des paiements</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RPieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => `${value.toFixed(2)}€`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </RPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top Products */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Top 5 Produits
                </CardTitle>
                <CardDescription>Les produits les plus vendus aujourd'hui</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" width={150} className="text-xs" />
                    <Tooltip 
                      formatter={(value: any) => `${value.toFixed(2)}€`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="revenue" fill={COLORS[1]} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Z Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart2 className="h-5 w-5 text-primary" />
                  Historique des Rapports Z
                </CardTitle>
                <CardDescription>Clôtures journalières</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {reports.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileBarChart2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun rapport Z enregistré</p>
                      </div>
                    ) : (
                      reports.map((report: any) => (
                        <Card key={report.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-lg">{report.serial_number}</h3>
                                  <Badge variant="outline">
                                    {format(new Date(report.report_date), 'dd MMMM yyyy', { locale: fr })}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                  <div>
                                    <p className="text-sm text-muted-foreground">CA Total</p>
                                    <p className="font-semibold text-lg">{report.total_sales.toFixed(2)}€</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Espèces</p>
                                    <p className="font-semibold">{report.total_cash.toFixed(2)}€</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">CB</p>
                                    <p className="font-semibold">{report.total_card.toFixed(2)}€</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Ventes</p>
                                    <p className="font-semibold">{report.sales_count}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <CardDescription>Total Ventes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics?.totalSales || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">transactions</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <CardDescription>Chiffre d'affaires</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics?.totalRevenue.toFixed(2)}€</div>
                  <p className="text-xs text-muted-foreground mt-1">total période</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <CardDescription>Panier moyen</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics?.averageBasket.toFixed(2)}€</div>
                  <p className="text-xs text-muted-foreground mt-1">par transaction</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <CardDescription>Croissance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    {comparative?.week.growth.toFixed(1)}%
                    {comparative && comparative.week.growth > 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">vs semaine dernière</p>
                </CardContent>
              </Card>
            </div>

          </TabsContent>
        </Tabs>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rapport Z - {selectedReport?.todayReport?.serial_number}</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <ReportZContent
              reportData={selectedReport.reportData}
              todayReport={selectedReport.todayReport}
              closingAmount={selectedReport.closingAmount}
              difference={selectedReport.difference}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
