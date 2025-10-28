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
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <FileDown className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Articles vendus</p>
            <p className="text-2xl font-bold">{totalQuantity.toFixed(0)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
            <p className="text-2xl font-bold">{totalAmount.toFixed(2)}€</p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Prix moy.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productStats.map((product, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right">{product.quantity.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold">{product.total.toFixed(2)}€</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {(product.total / product.quantity).toFixed(2)}€
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}