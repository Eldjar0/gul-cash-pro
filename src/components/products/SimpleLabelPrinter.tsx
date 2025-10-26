import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Tag } from 'lucide-react';
import { toast } from 'sonner';
import JsBarcode from 'jsbarcode';

interface SimpleLabelPrinterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Array<{
    id: string;
    name: string;
    barcode?: string;
    price: number;
    unit?: string;
    vat_rate?: number;
  }>;
}

export function SimpleLabelPrinter({ open, onOpenChange, products }: SimpleLabelPrinterProps) {
  const [copies, setCopies] = useState(1);

  const generateBarcodeDataUrl = (barcode: string): string => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, barcode, {
        format: 'EAN13',
        width: 2,
        height: 60,
        displayValue: false,
        margin: 0,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Erreur génération code-barres:', error);
      return '';
    }
  };

  const generateLabels = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression");
      return;
    }

    const labelsHtml = products
      .flatMap((product) =>
        Array(copies)
          .fill(null)
          .map(() => {
            const barcodeDataUrl = product.barcode ? generateBarcodeDataUrl(product.barcode) : '';
            const priceHT = product.price;
            const vatRate = product.vat_rate || 21;
            const priceTTC = priceHT * (1 + vatRate / 100);

            return `
              <div class="label">
                <div class="label-header">
                  <div class="product-name">${product.name}</div>
                  <div class="price">${priceTTC.toFixed(2)}€</div>
                </div>
                ${
                  barcodeDataUrl
                    ? `
                  <div class="barcode-container">
                    <img src="${barcodeDataUrl}" alt="barcode" class="barcode-image" />
                    <div class="barcode-number">${product.barcode}</div>
                  </div>
                `
                    : '<div class="no-barcode">Sans code-barre</div>'
                }
                <div class="label-footer">
                  <span>Prix HT: ${priceHT.toFixed(2)} €</span>
                  <span>TVA ${vatRate}%</span>
                </div>
              </div>
            `;
          })
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Étiquettes</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: 70mm 30mm;
            margin: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          
          .label {
            width: 70mm;
            height: 30mm;
            border: 1px solid #000;
            padding: 2mm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          
          .label-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1mm;
          }
          
          .product-name {
            font-size: 11pt;
            font-weight: bold;
            flex: 1;
            line-height: 1.2;
            max-width: 45mm;
          }
          
          .price {
            font-size: 16pt;
            font-weight: bold;
            white-space: nowrap;
            margin-left: 2mm;
          }
          
          .barcode-container {
            text-align: center;
            margin: 1mm 0;
          }
          
          .barcode-image {
            width: 100%;
            max-width: 60mm;
            height: auto;
          }
          
          .barcode-number {
            font-size: 9pt;
            margin-top: 0.5mm;
            letter-spacing: 1px;
          }
          
          .no-barcode {
            text-align: center;
            color: #999;
            font-size: 10pt;
            padding: 5mm 0;
          }
          
          .label-footer {
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            color: #333;
            border-top: 1px solid #ddd;
            padding-top: 1mm;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .label {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${labelsHtml}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();

    toast.success(`${products.length * copies} étiquette(s) générée(s)`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Imprimer des étiquettes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">
              {products.length} produit(s) sélectionné(s)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="copies">Nombre de copies par produit</Label>
            <Input
              id="copies"
              type="number"
              min="1"
              max="100"
              value={copies}
              onChange={(e) => setCopies(Number(e.target.value))}
            />
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-1 text-xs text-muted-foreground">
            <p>• Total: {products.length * copies} étiquette(s)</p>
            <p>• Format: 70mm × 30mm</p>
            <p>• Configurez votre imprimante avant d'imprimer</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button onClick={generateLabels} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
