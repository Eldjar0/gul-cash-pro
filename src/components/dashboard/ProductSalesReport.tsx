import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDown, Package, TrendingUp } from 'lucide-react';
import { exportProductsSalesCSV } from '@/utils/exportDocumentsXML';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
interface ProductSalesReportProps {
  documents: any[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  title?: string;
}
export function ProductSalesReport({
  documents,
  dateRange,
  title = 'Produits vendus'
}: ProductSalesReportProps) {
  const productStats = useMemo(() => {
    const stats: {
      [key: string]: {
        name: string;
        quantity: number;
        total: number;
        count: number;
      };
    } = {};
    documents.forEach(doc => {
      if (doc.is_cancelled) return;
      doc.sale_items?.forEach((item: any) => {
        const key = item.product_id || item.product_name;
        if (!stats[key]) {
          stats[key] = {
            name: item.product_name,
            quantity: 0,
            total: 0,
            count: 0
          };
        }
        stats[key].quantity += parseFloat(item.quantity);
        stats[key].total += parseFloat(item.total);
        stats[key].count += 1;
      });
    });
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [documents]);
  const totalQuantity = productStats.reduce((sum, p) => sum + p.quantity, 0);
  const totalAmount = productStats.reduce((sum, p) => sum + p.total, 0);
  const handleExportCSV = () => {
    exportProductsSalesCSV(documents, dateRange);
  };
  return;
}