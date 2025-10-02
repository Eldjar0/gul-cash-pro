import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Euro,
  Printer,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ReportsHistory() {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const { data: reports = [], isLoading } = useDailyReports();

  const handleViewReport = (report: any) => {
    // Transformer les données du rapport pour correspondre au format attendu
    const reportData = {
      totalSales: report.total_sales,
      totalCash: report.total_cash,
      totalCard: report.total_card,
      totalMobile: report.total_mobile,
      salesCount: report.sales_count,
      vatByRate: {}, // Pas stocké dans la DB, sera vide
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-destructive to-destructive/80 border-b border-destructive/20 px-4 md:px-6 py-3">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-white truncate">Historique Rapports Z</h1>
            <p className="text-xs md:text-sm text-white/80">Clôtures fiscales journalières</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Reports List */}
        <Card className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Date</TableHead>
                    <TableHead className="min-w-[100px]">Ouverture</TableHead>
                    <TableHead className="min-w-[100px]">Clôture</TableHead>
                    <TableHead className="min-w-[80px]">Ventes</TableHead>
                    <TableHead className="text-right min-w-[100px]">Total</TableHead>
                    <TableHead className="text-right min-w-[100px]">Espèces</TableHead>
                    <TableHead className="text-right min-w-[100px]">Carte</TableHead>
                    <TableHead className="text-right min-w-[100px]">Mobile</TableHead>
                    <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">
                            {format(new Date(report.report_date), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{report.opening_amount.toFixed(2)}€</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold">
                          {report.closing_amount ? `${report.closing_amount.toFixed(2)}€` : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {report.sales_count}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {report.total_sales.toFixed(2)}€
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm">{report.total_cash.toFixed(2)}€</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm">{report.total_card.toFixed(2)}€</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm">{report.total_mobile.toFixed(2)}€</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                          className="h-8"
                          disabled={!report.closing_amount}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Aucun rapport trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
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
