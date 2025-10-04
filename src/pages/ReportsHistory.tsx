import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Calendar,
  TrendingUp,
  DollarSign,
  CreditCard,
  Smartphone,
  Printer,
  BarChart3,
  FileBarChart2,
} from 'lucide-react';
import { useDailyReports } from '@/hooks/useDailyReports';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReportZContent } from '@/components/pos/ReportZContent';
import { printReportZ } from '@/components/pos/CloseDayDialog';

export default function ReportsHistory() {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const { data: reports = [], isLoading } = useDailyReports();

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-destructive mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground font-medium">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-destructive/5 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 rounded-xl">
              <FileBarChart2 className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-foreground">Historique Rapports Z</h1>
              <p className="text-muted-foreground text-lg">Clôtures fiscales journalières</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-destructive to-destructive/80 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100">
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

          <Card className="p-6 bg-gradient-to-br from-accent to-accent/80 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100">
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

          <Card className="p-6 bg-gradient-to-br from-category-blue to-category-blue/80 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100">
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

          <Card className="p-6 bg-gradient-to-br from-category-purple to-category-purple/80 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-100">
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

        {/* Reports List */}
        <Card className="bg-white border-0 shadow-xl overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-muted/30 to-muted/10">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-destructive" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Liste des Rapports</h2>
                <p className="text-sm text-muted-foreground">{reports.length} rapports enregistrés</p>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-520px)]">
            <div className="p-6 space-y-3">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="p-5 border-2 hover:border-destructive/30 hover:shadow-lg transition-all duration-100 cursor-pointer bg-gradient-to-r from-white to-muted/20"
                  onClick={() => handleViewReport(report)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-destructive/10 rounded-lg">
                        <Calendar className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-foreground">
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
                  <div className="inline-flex p-6 bg-muted/30 rounded-full mb-4">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-xl font-semibold text-muted-foreground">Aucun rapport trouvé</p>
                  <p className="text-sm text-muted-foreground mt-2">Les rapports de clôture apparaîtront ici</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Report Dialog */}
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
    </div>
  );
}
