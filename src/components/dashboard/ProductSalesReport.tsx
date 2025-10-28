import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDown, Package, TrendingUp } from 'lucide-react';
import { exportProductsSalesCSV } from '@/utils/exportDocumentsXML';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProductSalesReportProps {
  documents: any[];
  dateRange?: { start: Date; end: Date };
  title?: string;
}

export function ProductSalesReport({ documents, dateRange, title = 'Produits vendus' }: ProductSalesReportProps) {
  const productStats = useMemo(() => {
    const stats: { [key: string]: { name: string; quantity: number; total: number; count: number } } = {};
    
    documents.forEach(doc => {
      if (doc.is_cancelled) return;
      
      doc.sale_items?.forEach((item: any) => {
        const key = item.product_id || item.product_name;
        if (!stats[key]) {
          stats[key] = { name: item.product_name, quantity: 0, total: 0, count: 0 };
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
    <Card className="bg-white">
      <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Package className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">
                {productStats.length} produits • {totalQuantity.toFixed(0)} unités vendues
              </p>
            </div>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Produits uniques</span>
            </div>
            <p className="text-2xl font-bold text-emerald-900">{productStats.length}</p>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <div className="flex items-center gap-2 text-teal-700 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Quantité totale</span>
            </div>
            <p className="text-2xl font-bold text-teal-900">{totalQuantity.toFixed(0)}</p>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
            <div className="flex items-center gap-2 text-cyan-700 mb-1">
              <FileDown className="h-4 w-4" />
              <span className="text-sm font-medium">Montant total</span>
            </div>
            <p className="text-2xl font-bold text-cyan-900">{totalAmount.toFixed(2)}€</p>
          </Card>
        </div>

        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Quantité vendue</TableHead>
                <TableHead className="text-right">Ventes (nb)</TableHead>
                <TableHead className="text-right">Montant HT</TableHead>
                <TableHead className="text-right">Montant TTC</TableHead>
                <TableHead className="text-right">% du total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productStats.map((product, index) => {
                const percentage = (product.total / totalAmount) * 100;
                const htAmount = product.total / 1.21;
                
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <Badge variant={index === 0 ? 'default' : 'secondary'} className="text-xs">
                            #{index + 1}
                          </Badge>
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {product.quantity.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {product.count}
                    </TableCell>
                    <TableCell className="text-right">
                      {htAmount.toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {product.total.toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="font-mono">
                        {percentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {productStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun produit vendu sur cette période
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </Card>
  );
}
