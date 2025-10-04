import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeLabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Array<{
    id: string;
    name: string;
    barcode?: string;
    price: number;
  }>;
}

export function BarcodeLabelDialog({ open, onOpenChange, products }: BarcodeLabelDialogProps) {
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [copies, setCopies] = useState(1);
  const [showPrice, setShowPrice] = useState(true);

  const generateLabels = () => {
    // Create a print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression');
      return;
    }

    const labelStyles = {
      small: 'width: 4cm; height: 2cm; font-size: 8px;',
      medium: 'width: 5cm; height: 3cm; font-size: 10px;',
      large: 'width: 7cm; height: 4cm; font-size: 12px;',
    };

    const barcodeHeight = {
      small: '30px',
      medium: '40px',
      large: '50px',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Étiquettes Code-barres</title>
        <style>
          @page {
            size: auto;
            margin: 5mm;
          }
          body {
            margin: 0;
            padding: 10mm;
            font-family: Arial, sans-serif;
          }
          .labels-container {
            display: flex;
            flex-wrap: wrap;
            gap: 5mm;
          }
          .label {
            ${labelStyles[labelSize]}
            border: 1px solid #333;
            padding: 3mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-inside: avoid;
            box-sizing: border-box;
          }
          .product-name {
            font-weight: bold;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .barcode-container {
            text-align: center;
            margin: 2mm 0;
          }
          .barcode {
            height: ${barcodeHeight[labelSize]};
            background: repeating-linear-gradient(
              90deg,
              #000 0px, #000 1px,
              #fff 1px, #fff 2px
            );
          }
          .barcode-number {
            font-size: 0.9em;
            margin-top: 1mm;
          }
          .price {
            font-size: 1.2em;
            font-weight: bold;
            text-align: center;
          }
          @media print {
            .labels-container {
              gap: 3mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="labels-container">
          ${products.flatMap(product => 
            Array(copies).fill(null).map(() => `
              <div class="label">
                <div class="product-name">${product.name}</div>
                ${product.barcode ? `
                  <div class="barcode-container">
                    <div class="barcode"></div>
                    <div class="barcode-number">${product.barcode}</div>
                  </div>
                ` : '<div style="text-align: center; color: #999;">Sans code-barre</div>'}
                ${showPrice ? `<div class="price">${product.price.toFixed(2)}€</div>` : ''}
              </div>
            `).join('')
          ).join('')}
        </div>
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
            Générer des étiquettes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">{products.length} produit(s) sélectionné(s)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Taille des étiquettes</Label>
            <Select value={labelSize} onValueChange={(v: any) => setLabelSize(v)}>
              <SelectTrigger id="size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Petite (4x2cm)</SelectItem>
                <SelectItem value="medium">Moyenne (5x3cm)</SelectItem>
                <SelectItem value="large">Grande (7x4cm)</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-price"
              checked={showPrice}
              onChange={(e) => setShowPrice(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="show-price" className="cursor-pointer">
              Afficher le prix sur l'étiquette
            </Label>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-1 text-xs text-muted-foreground">
            <p>• Total d'étiquettes : {products.length * copies}</p>
            <p>• Les étiquettes s'imprimeront automatiquement</p>
            <p>• Configurez votre imprimante avant d'imprimer</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
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
