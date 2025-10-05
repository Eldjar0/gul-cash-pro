import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ExportDataButton } from '@/components/dashboard/ExportDataButton';
import { useSales } from '@/hooks/useSales';
import { useDailyRevenue, usePaymentMethodStats } from '@/hooks/useRevenueAnalytics';
import { useDailyReports } from '@/hooks/useDailyReports';
import { format, subDays, startOfWeek, startOfMonth, startOfQuarter, startOfYear, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  ShoppingCart, 
  Receipt, 
  Calendar as CalendarIcon,
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#3B82F6', '#14B8A6'];

type PeriodType = 'custom' | 'today' | 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'all';

export default function Stats() {
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfDay(new Date()));
  const [compareMode, setCompareMode] = useState(false);
  const [compareStartDate, setCompareStartDate] = useState<Date | undefined>();
  const [compareEndDate, setCompareEndDate] = useState<Date | undefined>();

  const { data: sales = [] } = useSales(startDate, endDate);
  const { data: compareSales = [] } = useSales(compareStartDate, compareEndDate);
  const { data: dailyRevenue = [] } = useDailyRevenue(30);
  const { data: paymentStats = [] } = usePaymentMethodStats(30);
  const { data: allReports = [] } = useDailyReports();

  const handlePeriodChange = (period: PeriodType) => {
    setPeriodType(period);
    const now = new Date();
    
    switch (period) {
      case 'today':
        setStartDate(new Date(now.setHours(0, 0, 0, 0)));
        setEndDate(endOfDay(new Date()));
        break;
      case 'week':
        setStartDate(startOfWeek(now, { locale: fr }));
        setEndDate(endOfDay(new Date()));
        break;
      case 'month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfDay(new Date()));
        break;
      case 'quarter':
        setStartDate(startOfQuarter(now));
        setEndDate(endOfDay(new Date()));
        break;
      case 'semester':
        const semesterStart = now.getMonth() < 6 ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), 6, 1);
        setStartDate(semesterStart);
        setEndDate(endOfDay(new Date()));
        break;
      case 'year':
        setStartDate(startOfYear(now));
        setEndDate(endOfDay(new Date()));
        break;
      case 'all':
        setStartDate(new Date(2020, 0, 1));
        setEndDate(endOfDay(new Date()));
        break;
    }
  };

  // Filtrer les rapports Z selon la période
  const filteredReports = allReports.filter((report) => {
    const reportDate = parseISO(report.report_date);
    return isWithinInterval(reportDate, { start: startDate, end: endDate });
  });

  // Calculs des statistiques
  const activeSales = sales.filter(s => !s.is_cancelled);
  const totalRevenue = activeSales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalVAT = activeSales.reduce((sum, s) => sum + Number(s.total_vat), 0);
  const avgBasket = activeSales.length > 0 ? totalRevenue / activeSales.length : 0;
  const salesCount = activeSales.length;

  // Statistiques de comparaison
  const compareActiveSales = compareSales.filter(s => !s.is_cancelled);
  const compareRevenue = compareActiveSales.reduce((sum, s) => sum + Number(s.total), 0);
  const growthRate = compareRevenue > 0 ? ((totalRevenue - compareRevenue) / compareRevenue) * 100 : 0;

  // Stats par produit
  const productStats = new Map<string, { 
    name: string; 
    quantity: number; 
    revenue: number; 
    count: number;
    barcode?: string;
  }>();
  
  activeSales.forEach(sale => {
    sale.sale_items?.forEach((item: any) => {
      const existing = productStats.get(item.product_id || item.product_name);
      if (existing) {
        existing.quantity += Number(item.quantity);
        existing.revenue += Number(item.total);
        existing.count += 1;
      } else {
        productStats.set(item.product_id || item.product_name, {
          name: item.product_name,
          quantity: Number(item.quantity),
          revenue: Number(item.total),
          count: 1,
          barcode: item.product_barcode
        });
      }
    });
  });

  const topProducts = Array.from(productStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20);

  // Stats par méthode de paiement
  const paymentMethodStats = new Map<string, { count: number; total: number }>();
  activeSales.forEach(sale => {
    const method = sale.payment_method || 'unknown';
    const existing = paymentMethodStats.get(method);
    if (existing) {
      existing.count += 1;
      existing.total += Number(sale.total);
    } else {
      paymentMethodStats.set(method, { count: 1, total: Number(sale.total) });
    }
  });

  const paymentData = Array.from(paymentMethodStats.entries()).map(([method, data]) => ({
    method: method === 'cash' ? 'Espèces' : 
            method === 'card' ? 'Carte' : 
            method === 'mobile' ? 'Mobile' : 
            method === 'check' ? 'Chèque' : method,
    count: data.count,
    total: data.total,
    percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0
  }));

  // Stats par jour
  const dailyStats = new Map<string, { revenue: number; count: number }>();
  activeSales.forEach(sale => {
    const dateKey = format(new Date(sale.date || sale.created_at), 'yyyy-MM-dd');
    const existing = dailyStats.get(dateKey);
    if (existing) {
      existing.revenue += Number(sale.total);
      existing.count += 1;
    } else {
      dailyStats.set(dateKey, { revenue: Number(sale.total), count: 1 });
    }
  });

  const dailyData = Array.from(dailyStats.entries())
    .map(([date, data]) => ({
      date: format(new Date(date), 'dd/MM', { locale: fr }),
      revenue: data.revenue,
      count: data.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Rapport de Ventes - Contrôle Fiscal', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Période: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`, 14, 30);
    doc.text(`Date d'export: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);
    
    // Statistiques générales
    doc.setFontSize(14);
    doc.text('Statistiques Générales', 14, 46);
    doc.setFontSize(10);
    doc.text(`Nombre de ventes: ${salesCount}`, 14, 54);
    doc.text(`Chiffre d'affaires TTC: ${totalRevenue.toFixed(2)}€`, 14, 60);
    doc.text(`TVA collectée: ${totalVAT.toFixed(2)}€`, 14, 66);
    doc.text(`Panier moyen: ${avgBasket.toFixed(2)}€`, 14, 72);

    // Table des ventes
    const salesData = activeSales.map(sale => [
      sale.sale_number,
      format(new Date(sale.date || sale.created_at), 'dd/MM/yyyy HH:mm'),
      sale.payment_method,
      sale.subtotal.toFixed(2) + '€',
      sale.total_vat.toFixed(2) + '€',
      sale.total.toFixed(2) + '€'
    ]);

    autoTable(doc, {
      startY: 82,
      head: [['N° Vente', 'Date', 'Paiement', 'HT', 'TVA', 'TTC']],
      body: salesData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    doc.save(`ventes_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.pdf`);
  };

  // Export XML
  const exportXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rapport_ventes>\n';
    xml += `  <periode>\n`;
    xml += `    <debut>${format(startDate, 'yyyy-MM-dd')}</debut>\n`;
    xml += `    <fin>${format(endDate, 'yyyy-MM-dd')}</fin>\n`;
    xml += `  </periode>\n`;
    xml += `  <statistiques>\n`;
    xml += `    <nombre_ventes>${salesCount}</nombre_ventes>\n`;
    xml += `    <chiffre_affaires_ttc>${totalRevenue.toFixed(2)}</chiffre_affaires_ttc>\n`;
    xml += `    <tva_collectee>${totalVAT.toFixed(2)}</tva_collectee>\n`;
    xml += `    <panier_moyen>${avgBasket.toFixed(2)}</panier_moyen>\n`;
    xml += `  </statistiques>\n`;
    xml += `  <ventes>\n`;
    
    activeSales.forEach(sale => {
      xml += `    <vente>\n`;
      xml += `      <numero>${sale.sale_number}</numero>\n`;
      xml += `      <date>${format(new Date(sale.date || sale.created_at), 'yyyy-MM-dd HH:mm:ss')}</date>\n`;
      xml += `      <methode_paiement>${sale.payment_method}</methode_paiement>\n`;
      xml += `      <montant_ht>${sale.subtotal.toFixed(2)}</montant_ht>\n`;
      xml += `      <montant_tva>${sale.total_vat.toFixed(2)}</montant_tva>\n`;
      xml += `      <montant_ttc>${sale.total.toFixed(2)}</montant_ttc>\n`;
      xml += `      <articles>\n`;
      sale.sale_items?.forEach((item: any) => {
        xml += `        <article>\n`;
        xml += `          <nom>${item.product_name}</nom>\n`;
        xml += `          <code_barre>${item.product_barcode || ''}</code_barre>\n`;
        xml += `          <quantite>${item.quantity}</quantite>\n`;
        xml += `          <prix_unitaire>${item.unit_price.toFixed(2)}</prix_unitaire>\n`;
        xml += `          <taux_tva>${item.vat_rate}</taux_tva>\n`;
        xml += `          <total>${item.total.toFixed(2)}</total>\n`;
        xml += `        </article>\n`;
      });
      xml += `      </articles>\n`;
      xml += `    </vente>\n`;
    });
    
    xml += `  </ventes>\n`;
    xml += '</rapport_ventes>';

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventes_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Produits PDF
  const exportProductsToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Rapport Produits Vendus', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Période: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`, 14, 30);
    doc.text(`Date d'export: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);
    
    // Statistiques générales
    doc.setFontSize(14);
    doc.text('Statistiques Produits', 14, 46);
    doc.setFontSize(10);
    doc.text(`Nombre de produits différents: ${topProducts.length}`, 14, 54);
    doc.text(`Chiffre d'affaires total: ${totalRevenue.toFixed(2)}€`, 14, 60);

    // Table des produits
    const productsData = topProducts.map((product, idx) => [
      (idx + 1).toString(),
      product.name,
      product.quantity.toString(),
      product.count.toString(),
      product.revenue.toFixed(2) + '€',
      ((product.revenue / totalRevenue) * 100).toFixed(1) + '%'
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['#', 'Produit', 'Qté', 'Nb ventes', 'CA', '% CA']],
      body: productsData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    doc.save(`produits_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.pdf`);
  };

  // Calculs comptables avancés
  const vatBreakdown = (() => {
    const vatMap = new Map<number, { totalHT: number; totalVAT: number; count: number }>();
    
    activeSales.forEach((sale: any) => {
      if (sale.sale_items) {
        sale.sale_items.forEach((item: any) => {
          const rate = Number(item.vat_rate) || 0;
          const subtotal = Number(item.subtotal) || 0;
          const vatAmount = Number(item.vat_amount) || 0;
          
          if (!vatMap.has(rate)) {
            vatMap.set(rate, { totalHT: 0, totalVAT: 0, count: 0 });
          }
          
          const current = vatMap.get(rate)!;
          current.totalHT += subtotal;
          current.totalVAT += vatAmount;
          current.count += 1;
        });
      }
    });
    
    return Array.from(vatMap.entries())
      .map(([rate, data]) => ({ rate, ...data }))
      .sort((a, b) => a.rate - b.rate);
  })();

  const freeItemsCount = (() => {
    let count = 0;
    activeSales.forEach((sale: any) => {
      if (sale.sale_items) {
        sale.sale_items.forEach((item: any) => {
          if (Number(item.unit_price) === 0) {
            count += Number(item.quantity);
          }
        });
      }
    });
    return count;
  })();

  // Export Comptabilité PDF
  const exportAccountingPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Rapport Comptable Détaillé', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Période: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`, 14, 30);
    doc.text(`Date d'export: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);
    
    // Résumé général
    doc.setFontSize(14);
    doc.text('Résumé Général', 14, 46);
    doc.setFontSize(10);
    doc.text(`Total TTC: ${totalRevenue.toFixed(2)}€`, 14, 54);
    doc.text(`Total HT: ${(totalRevenue - totalVAT).toFixed(2)}€`, 14, 60);
    doc.text(`TVA Totale: ${totalVAT.toFixed(2)}€`, 14, 66);
    doc.text(`Articles gratuits: ${freeItemsCount}`, 14, 72);
    doc.text(`Nombre de ventes: ${salesCount}`, 14, 78);

    // TVA par taux
    let yPos = 88;
    doc.setFontSize(14);
    doc.text('Détails TVA par taux', 14, yPos);
    yPos += 8;
    
    const vatData = vatBreakdown.map(vat => [
      `${vat.rate}%`,
      vat.count.toString(),
      vat.totalHT.toFixed(2) + '€',
      vat.totalVAT.toFixed(2) + '€',
      (vat.totalHT + vat.totalVAT).toFixed(2) + '€'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Taux', 'Nb articles', 'Montant HT', 'TVA', 'Montant TTC']],
      body: vatData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    // Rapports Z
    if (filteredReports.length > 0) {
      yPos = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Rapports Z de la période', 14, yPos);
      yPos += 8;

      const reportsData = filteredReports.map(report => [
        report.serial_number || 'En cours',
        format(parseISO(report.report_date), 'dd/MM/yyyy'),
        report.sales_count.toString(),
        report.total_cash.toFixed(2) + '€',
        report.total_card.toFixed(2) + '€',
        report.total_mobile.toFixed(2) + '€',
        report.total_sales.toFixed(2) + '€'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['N° Série', 'Date', 'Nb ventes', 'Espèces', 'Carte', 'Mobile', 'Total']],
        body: reportsData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246] }
      });
    }

    doc.save(`comptabilite_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.pdf`);
  };

  // Export Comptabilité XML
  const exportAccountingXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rapport_comptable>\n';
    xml += `  <periode>\n`;
    xml += `    <debut>${format(startDate, 'yyyy-MM-dd')}</debut>\n`;
    xml += `    <fin>${format(endDate, 'yyyy-MM-dd')}</fin>\n`;
    xml += `  </periode>\n`;
    
    xml += `  <resume_general>\n`;
    xml += `    <total_ttc>${totalRevenue.toFixed(2)}</total_ttc>\n`;
    xml += `    <total_ht>${(totalRevenue - totalVAT).toFixed(2)}</total_ht>\n`;
    xml += `    <tva_totale>${totalVAT.toFixed(2)}</tva_totale>\n`;
    xml += `    <articles_gratuits>${freeItemsCount}</articles_gratuits>\n`;
    xml += `    <nombre_ventes>${salesCount}</nombre_ventes>\n`;
    xml += `  </resume_general>\n`;
    
    xml += `  <details_tva>\n`;
    vatBreakdown.forEach(vat => {
      xml += `    <taux_tva>\n`;
      xml += `      <taux>${vat.rate}</taux>\n`;
      xml += `      <nombre_articles>${vat.count}</nombre_articles>\n`;
      xml += `      <montant_ht>${vat.totalHT.toFixed(2)}</montant_ht>\n`;
      xml += `      <tva_collectee>${vat.totalVAT.toFixed(2)}</tva_collectee>\n`;
      xml += `      <montant_ttc>${(vat.totalHT + vat.totalVAT).toFixed(2)}</montant_ttc>\n`;
      xml += `    </taux_tva>\n`;
    });
    xml += `  </details_tva>\n`;
    
    xml += `  <rapports_z>\n`;
    filteredReports.forEach(report => {
      xml += `    <rapport>\n`;
      xml += `      <numero_serie>${report.serial_number || 'En cours'}</numero_serie>\n`;
      xml += `      <date>${report.report_date}</date>\n`;
      xml += `      <nombre_ventes>${report.sales_count}</nombre_ventes>\n`;
      xml += `      <especes>${report.total_cash.toFixed(2)}</especes>\n`;
      xml += `      <carte>${report.total_card.toFixed(2)}</carte>\n`;
      xml += `      <mobile>${report.total_mobile.toFixed(2)}</mobile>\n`;
      xml += `      <total>${report.total_sales.toFixed(2)}</total>\n`;
      xml += `    </rapport>\n`;
    });
    xml += `  </rapports_z>\n`;
    
    xml += '</rapport_comptable>';

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comptabilite_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Evolution PDF
  const exportEvolutionPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Rapport Évolution des Ventes', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Période: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`, 14, 30);
    doc.text(`Date d'export: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);
    
    // Statistiques générales
    doc.setFontSize(14);
    doc.text('Résumé', 14, 46);
    doc.setFontSize(10);
    doc.text(`Chiffre d'affaires total: ${totalRevenue.toFixed(2)}€`, 14, 54);
    doc.text(`Nombre de ventes: ${salesCount}`, 14, 60);
    doc.text(`Panier moyen: ${avgBasket.toFixed(2)}€`, 14, 66);

    // Table évolution par jour
    const evolutionData = dailyData.map(day => [
      day.date,
      day.count.toString(),
      day.revenue.toFixed(2) + '€',
      (day.revenue / day.count).toFixed(2) + '€'
    ]);

    autoTable(doc, {
      startY: 76,
      head: [['Date', 'Nb ventes', 'CA', 'Panier moyen']],
      body: evolutionData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    doc.save(`evolution_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.pdf`);
  };

  // Export Evolution XML
  const exportEvolutionXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rapport_evolution>\n';
    xml += `  <periode>\n`;
    xml += `    <debut>${format(startDate, 'yyyy-MM-dd')}</debut>\n`;
    xml += `    <fin>${format(endDate, 'yyyy-MM-dd')}</fin>\n`;
    xml += `  </periode>\n`;
    xml += `  <resume>\n`;
    xml += `    <chiffre_affaires_total>${totalRevenue.toFixed(2)}</chiffre_affaires_total>\n`;
    xml += `    <nombre_ventes>${salesCount}</nombre_ventes>\n`;
    xml += `    <panier_moyen>${avgBasket.toFixed(2)}</panier_moyen>\n`;
    xml += `  </resume>\n`;
    xml += `  <evolution_journaliere>\n`;
    
    dailyData.forEach(day => {
      xml += `    <jour>\n`;
      xml += `      <date>${day.date}</date>\n`;
      xml += `      <nombre_ventes>${day.count}</nombre_ventes>\n`;
      xml += `      <chiffre_affaires>${day.revenue.toFixed(2)}</chiffre_affaires>\n`;
      xml += `      <panier_moyen>${(day.revenue / day.count).toFixed(2)}</panier_moyen>\n`;
      xml += `    </jour>\n`;
    });
    
    xml += `  </evolution_journaliere>\n`;
    xml += '</rapport_evolution>';

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evolution_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Paiements PDF
  const exportPaymentsPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Rapport Modes de Paiement', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Période: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`, 14, 30);
    doc.text(`Date d'export: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);
    
    // Statistiques
    doc.setFontSize(14);
    doc.text('Répartition des paiements', 14, 46);
    doc.setFontSize(10);
    doc.text(`Nombre total de transactions: ${salesCount}`, 14, 54);
    doc.text(`Montant total: ${totalRevenue.toFixed(2)}€`, 14, 60);

    // Table des paiements
    const paymentsData = paymentData.map(method => [
      method.method,
      method.count.toString(),
      method.total.toFixed(2) + '€',
      method.percentage.toFixed(1) + '%'
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Mode de paiement', 'Nb transactions', 'Montant', '% du total']],
      body: paymentsData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    doc.save(`paiements_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.pdf`);
  };

  // Export Paiements XML
  const exportPaymentsXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rapport_paiements>\n';
    xml += `  <periode>\n`;
    xml += `    <debut>${format(startDate, 'yyyy-MM-dd')}</debut>\n`;
    xml += `    <fin>${format(endDate, 'yyyy-MM-dd')}</fin>\n`;
    xml += `  </periode>\n`;
    xml += `  <statistiques>\n`;
    xml += `    <nombre_transactions>${salesCount}</nombre_transactions>\n`;
    xml += `    <montant_total>${totalRevenue.toFixed(2)}</montant_total>\n`;
    xml += `  </statistiques>\n`;
    xml += `  <modes_paiement>\n`;
    
    paymentData.forEach(method => {
      xml += `    <mode>\n`;
      xml += `      <nom>${method.method}</nom>\n`;
      xml += `      <nombre_transactions>${method.count}</nombre_transactions>\n`;
      xml += `      <montant>${method.total.toFixed(2)}</montant>\n`;
      xml += `      <pourcentage>${method.percentage.toFixed(2)}</pourcentage>\n`;
      xml += `    </mode>\n`;
    });
    
    xml += `  </modes_paiement>\n`;
    xml += '</rapport_paiements>';

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paiements_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Classement PDF
  const exportRankingPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Classement des Produits', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Période: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`, 14, 30);
    doc.text(`Date d'export: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);
    
    // Top 10 produits
    doc.setFontSize(14);
    doc.text('Top 10 - Produits les plus vendus', 14, 46);
    
    const topData = topProducts.slice(0, 10).map((product, idx) => [
      (idx + 1).toString(),
      product.name,
      product.quantity.toString(),
      product.count.toString(),
      product.revenue.toFixed(2) + '€'
    ]);

    autoTable(doc, {
      startY: 54,
      head: [['Rang', 'Produit', 'Qté vendue', 'Nb ventes', 'CA']],
      body: topData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    // Produits moins vendus
    const yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Produits les moins vendus', 14, yPos);

    const bottomData = topProducts.slice().reverse().slice(0, 10).map((product, idx) => [
      (topProducts.length - idx).toString(),
      product.name,
      product.quantity.toString(),
      product.count.toString(),
      product.revenue.toFixed(2) + '€'
    ]);

    autoTable(doc, {
      startY: yPos + 8,
      head: [['Rang', 'Produit', 'Qté vendue', 'Nb ventes', 'CA']],
      body: bottomData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] }
    });

    doc.save(`classement_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.pdf`);
  };

  // Export Classement XML
  const exportRankingXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<classement_produits>\n';
    xml += `  <periode>\n`;
    xml += `    <debut>${format(startDate, 'yyyy-MM-dd')}</debut>\n`;
    xml += `    <fin>${format(endDate, 'yyyy-MM-dd')}</fin>\n`;
    xml += `  </periode>\n`;
    
    xml += `  <top_produits>\n`;
    topProducts.slice(0, 10).forEach((product, idx) => {
      xml += `    <produit>\n`;
      xml += `      <rang>${idx + 1}</rang>\n`;
      xml += `      <nom>${product.name}</nom>\n`;
      xml += `      <code_barre>${product.barcode || ''}</code_barre>\n`;
      xml += `      <quantite_vendue>${product.quantity}</quantite_vendue>\n`;
      xml += `      <nombre_ventes>${product.count}</nombre_ventes>\n`;
      xml += `      <chiffre_affaires>${product.revenue.toFixed(2)}</chiffre_affaires>\n`;
      xml += `    </produit>\n`;
    });
    xml += `  </top_produits>\n`;
    
    xml += `  <produits_moins_vendus>\n`;
    topProducts.slice().reverse().slice(0, 10).forEach((product, idx) => {
      xml += `    <produit>\n`;
      xml += `      <rang>${topProducts.length - idx}</rang>\n`;
      xml += `      <nom>${product.name}</nom>\n`;
      xml += `      <code_barre>${product.barcode || ''}</code_barre>\n`;
      xml += `      <quantite_vendue>${product.quantity}</quantite_vendue>\n`;
      xml += `      <nombre_ventes>${product.count}</nombre_ventes>\n`;
      xml += `      <chiffre_affaires>${product.revenue.toFixed(2)}</chiffre_affaires>\n`;
      xml += `    </produit>\n`;
    });
    xml += `  </produits_moins_vendus>\n`;
    
    xml += '</classement_produits>';

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classement_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Produits XML
  const exportProductsXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rapport_produits>\n';
    xml += `  <periode>\n`;
    xml += `    <debut>${format(startDate, 'yyyy-MM-dd')}</debut>\n`;
    xml += `    <fin>${format(endDate, 'yyyy-MM-dd')}</fin>\n`;
    xml += `  </periode>\n`;
    xml += `  <statistiques>\n`;
    xml += `    <nombre_produits>${topProducts.length}</nombre_produits>\n`;
    xml += `    <chiffre_affaires_total>${totalRevenue.toFixed(2)}</chiffre_affaires_total>\n`;
    xml += `  </statistiques>\n`;
    xml += `  <produits>\n`;
    
    topProducts.forEach((product, idx) => {
      xml += `    <produit>\n`;
      xml += `      <rang>${idx + 1}</rang>\n`;
      xml += `      <nom>${product.name}</nom>\n`;
      xml += `      <code_barre>${product.barcode || ''}</code_barre>\n`;
      xml += `      <quantite_vendue>${product.quantity}</quantite_vendue>\n`;
      xml += `      <nombre_ventes>${product.count}</nombre_ventes>\n`;
      xml += `      <chiffre_affaires>${product.revenue.toFixed(2)}</chiffre_affaires>\n`;
      xml += `      <pourcentage_ca>${((product.revenue / totalRevenue) * 100).toFixed(2)}</pourcentage_ca>\n`;
      xml += `    </produit>\n`;
    });
    
    xml += `  </produits>\n`;
    xml += '</rapport_produits>';

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produits_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Statistiques & Analyses</h1>
          <p className="text-muted-foreground">Analyse complète des performances de vente</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={exportXML} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export XML
          </Button>
        </div>
      </div>

      {/* Filtres de période */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Période d'analyse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['today', 'week', 'month', 'quarter', 'semester', 'year', 'all', 'custom'] as PeriodType[]).map(period => (
              <Button
                key={period}
                variant={periodType === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange(period)}
              >
                {period === 'today' ? 'Aujourd\'hui' :
                 period === 'week' ? 'Semaine' :
                 period === 'month' ? 'Mois' :
                 period === 'quarter' ? 'Trimestre' :
                 period === 'semester' ? 'Semestre' :
                 period === 'year' ? 'Année' :
                 period === 'all' ? 'Depuis le début' :
                 'Personnalisé'}
              </Button>
            ))}
          </div>

          {periodType === 'custom' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de début</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal pointer-events-auto")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, 'PPP', { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal pointer-events-auto")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, 'PPP', { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(endOfDay(date))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Mode comparaison */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <label className="text-sm font-medium">Comparer avec une autre période</label>
            <Button
              variant={compareMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCompareMode(!compareMode)}
            >
              {compareMode ? 'Activé' : 'Désactivé'}
            </Button>
          </div>

          {compareMode && (
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium">Période de comparaison - Début</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal pointer-events-auto")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {compareStartDate ? format(compareStartDate, 'PPP', { locale: fr }) : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={compareStartDate}
                      onSelect={setCompareStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Période de comparaison - Fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal pointer-events-auto")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {compareEndDate ? format(compareEndDate, 'PPP', { locale: fr }) : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={compareEndDate}
                      onSelect={(date) => date && setCompareEndDate(endOfDay(date))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)}€</div>
            {compareMode && compareRevenue > 0 && (
              <p className={cn("text-xs flex items-center gap-1 mt-2", growthRate >= 0 ? "text-green-600" : "text-red-600")}>
                {growthRate >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(growthRate).toFixed(1)}% vs période comparée
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nombre de ventes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              transactions réalisées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgBasket.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground mt-2">
              par transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TVA collectée</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVAT.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground mt-2">
              à reverser
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et analyses */}
      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="evolution">Évolution</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="ranking">Classement</TabsTrigger>
          <TabsTrigger value="accounting">Comptabilité</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={exportEvolutionPDF} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF Évolution
            </Button>
            <Button onClick={exportEvolutionXML} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export XML Évolution
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Évolution du chiffre d'affaires</CardTitle>
              <CardDescription>CA et nombre de ventes par jour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} name="CA (€)" />
                  <Line yAxisId="right" type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={2} name="Nb ventes" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={exportProductsToPDF} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF Produits
            </Button>
            <Button onClick={exportProductsXML} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export XML Produits
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance des produits</CardTitle>
              <CardDescription>Top 20 produits par chiffre d'affaires</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={200} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8B5CF6" name="CA (€)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quantités vendues</CardTitle>
              <CardDescription>Produits les plus vendus en quantité</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.slice(0, 10).map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity} unités • {product.count} ventes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{product.revenue.toFixed(2)}€</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={exportPaymentsPDF} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF Paiements
            </Button>
            <Button onClick={exportPaymentsXML} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export XML Paiements
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par paiement</CardTitle>
                <CardDescription>Distribution des modes de paiement</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentData}
                      dataKey="total"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.percentage.toFixed(1)}%`}
                    >
                      {paymentData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Détails par paiement</CardTitle>
                <CardDescription>Nombre et montant des transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentData.map((method, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{method.method}</span>
                        <span className="text-sm text-muted-foreground">{method.count} transactions</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${method.percentage}%`,
                              backgroundColor: COLORS[idx % COLORS.length]
                            }}
                          />
                        </div>
                        <span className="ml-4 font-bold">{method.total.toFixed(2)}€</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={exportRankingPDF} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF Classement
            </Button>
            <Button onClick={exportRankingXML} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export XML Classement
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏆 Top 10 - Plus vendus
                </CardTitle>
                <CardDescription>Produits les plus performants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topProducts.slice(0, 10).map((product, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold",
                        idx === 0 ? "bg-yellow-500 text-white" :
                        idx === 1 ? "bg-gray-400 text-white" :
                        idx === 2 ? "bg-orange-600 text-white" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} unités</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{product.revenue.toFixed(2)}€</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📉 Moins vendus
                </CardTitle>
                <CardDescription>Produits à faible rotation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topProducts.slice().reverse().slice(0, 10).map((product, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground font-medium">
                        {topProducts.length - idx}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} unités</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{product.revenue.toFixed(2)}€</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounting" className="space-y-4">
          {/* Export buttons */}
          <div className="flex gap-2">
            <Button onClick={exportAccountingPDF} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF Comptabilité
            </Button>
            <Button onClick={exportAccountingXML} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export XML Comptabilité
            </Button>
          </div>

          {/* Résumé TVA */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total TTC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalRevenue.toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground mt-1">Toutes taxes comprises</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total HT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{(totalRevenue - totalVAT).toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground mt-1">Hors taxes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">TVA Totale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalVAT.toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground mt-1">À reverser</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Articles Gratuits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{freeItemsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Cadeaux offerts</p>
              </CardContent>
            </Card>
          </div>

          {/* Détails TVA par taux */}
          <Card>
            <CardHeader>
              <CardTitle>Détails TVA par taux</CardTitle>
              <CardDescription>Répartition du chiffre d'affaires par taux de TVA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vatBreakdown.map((vat) => (
                  <div key={vat.rate} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">TVA {vat.rate}%</h3>
                      <span className="text-sm text-muted-foreground">{vat.count} articles</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Montant HT</p>
                        <p className="font-bold">{vat.totalHT.toFixed(2)}€</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">TVA collectée</p>
                        <p className="font-bold text-green-600">{vat.totalVAT.toFixed(2)}€</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Montant TTC</p>
                        <p className="font-bold text-primary">{(vat.totalHT + vat.totalVAT).toFixed(2)}€</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Liste des rapports Z */}
          <Card>
            <CardHeader>
              <CardTitle>Rapports Z de la période</CardTitle>
              <CardDescription>
                {filteredReports.length} rapport(s) sur la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredReports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun rapport Z disponible pour cette période
                  </p>
                ) : (
                  filteredReports.map((report) => (
                    <div key={report.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">
                            {report.serial_number || 'En cours'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(report.report_date), 'EEEE dd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">{report.total_sales.toFixed(2)}€</p>
                          <p className="text-xs text-muted-foreground">{report.sales_count} ventes</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t text-sm">
                        <div>
                          <p className="text-muted-foreground">Espèces</p>
                          <p className="font-semibold">{report.total_cash.toFixed(2)}€</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Carte</p>
                          <p className="font-semibold">{report.total_card.toFixed(2)}€</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mobile</p>
                          <p className="font-semibold">{report.total_mobile.toFixed(2)}€</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
