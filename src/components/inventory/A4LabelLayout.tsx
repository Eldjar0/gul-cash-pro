import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface StickerFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  columns: number;
  rows: number;
  marginTop: number;
  marginLeft: number;
  gapX: number;
  gapY: number;
}

export interface LabelSlot {
  position: number;
  productId?: string;
  productName?: string;
  barcode?: string;
  price?: number;
  customData?: any;
}

interface A4LabelLayoutProps {
  format: StickerFormat;
  onFormatChange: (format: StickerFormat) => void;
  slots: LabelSlot[];
  onSlotsChange: (slots: LabelSlot[]) => void;
  onSlotClick?: (position: number) => void;
}

export const PREDEFINED_FORMATS: StickerFormat[] = [
  {
    id: 'avery-l7163',
    name: 'Avery L7163 (14 étiquettes - 99.1 x 38.1 mm)',
    width: 99.1,
    height: 38.1,
    columns: 2,
    rows: 7,
    marginTop: 15.1,
    marginLeft: 4.65,
    gapX: 2.5,
    gapY: 0,
  },
  {
    id: 'avery-l7160',
    name: 'Avery L7160 (21 étiquettes - 63.5 x 38.1 mm)',
    width: 63.5,
    height: 38.1,
    columns: 3,
    rows: 7,
    marginTop: 15.1,
    marginLeft: 7.0,
    gapX: 2.5,
    gapY: 0,
  },
  {
    id: 'avery-l7162',
    name: 'Avery L7162 (16 étiquettes - 99.1 x 33.9 mm)',
    width: 99.1,
    height: 33.9,
    columns: 2,
    rows: 8,
    marginTop: 15.1,
    marginLeft: 4.65,
    gapX: 2.5,
    gapY: 0,
  },
  {
    id: 'avery-3422',
    name: 'Avery 3422 (18 étiquettes - 70 x 42.3 mm)',
    width: 70,
    height: 42.3,
    columns: 3,
    rows: 6,
    marginTop: 21.5,
    marginLeft: 0,
    gapX: 0,
    gapY: 0,
  },
  {
    id: 'square-50',
    name: 'Format carré (24 étiquettes - 50 x 50 mm)',
    width: 50,
    height: 50,
    columns: 4,
    rows: 6,
    marginTop: 5,
    marginLeft: 2.5,
    gapX: 0,
    gapY: 0,
  },
  {
    id: 'small-48',
    name: 'Petites (40 étiquettes - 48.5 x 25.4 mm)',
    width: 48.5,
    height: 25.4,
    columns: 4,
    rows: 10,
    marginTop: 13,
    marginLeft: 5,
    gapX: 2.5,
    gapY: 0,
  },
];

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX_RATIO = 3.78; // 96 DPI

export const A4LabelLayout = ({
  format,
  onFormatChange,
  slots,
  onSlotsChange,
  onSlotClick,
}: A4LabelLayoutProps) => {
  
  const totalSlots = format.columns * format.rows;

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    const productData = e.dataTransfer.getData('product');
    if (!productData) return;

    const product = JSON.parse(productData);
    const newSlots = [...slots];
    
    // Find or create slot
    let slot = newSlots.find(s => s.position === position);
    if (slot) {
      slot.productId = product.id;
      slot.productName = product.name;
      slot.barcode = product.barcode;
      slot.price = product.price;
    } else {
      newSlots.push({
        position,
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        price: product.price,
      });
    }
    
    onSlotsChange(newSlots);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeSlot = (position: number) => {
    const newSlots = slots.filter(s => s.position !== position);
    onSlotsChange(newSlots);
  };

  const getSlotData = (position: number) => {
    return slots.find(s => s.position === position);
  };

  const calculatePosition = (row: number, col: number) => {
    const x = format.marginLeft + col * (format.width + format.gapX);
    const y = format.marginTop + row * (format.height + format.gapY);
    return { x, y };
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Format d'autocollants</Label>
          <Select
            value={format.id}
            onValueChange={(value) => {
              const selected = PREDEFINED_FORMATS.find(f => f.id === value);
              if (selected) onFormatChange(selected);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PREDEFINED_FORMATS.map(fmt => (
                <SelectItem key={fmt.id} value={fmt.id}>
                  {fmt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-secondary/20">
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground mb-2 text-center">
            Feuille A4 - Glissez-déposez les produits sur les emplacements
          </div>
          
          <div 
            className="bg-white shadow-lg mx-auto border-2 border-border"
            style={{
              width: `${A4_WIDTH_MM * MM_TO_PX_RATIO}px`,
              height: `${A4_HEIGHT_MM * MM_TO_PX_RATIO}px`,
              position: 'relative',
              maxWidth: '100%',
              aspectRatio: `${A4_WIDTH_MM} / ${A4_HEIGHT_MM}`,
            }}
          >
            {/* Grid de slots */}
            {Array.from({ length: format.rows }).map((_, rowIdx) => (
              Array.from({ length: format.columns }).map((_, colIdx) => {
                const position = rowIdx * format.columns + colIdx + 1;
                const { x, y } = calculatePosition(rowIdx, colIdx);
                const slotData = getSlotData(position);
                
                return (
                  <div
                    key={position}
                    className={`absolute border transition-all ${
                      slotData 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-muted/30 border-dashed border-muted-foreground/30 hover:bg-muted/50'
                    }`}
                    style={{
                      left: `${x * MM_TO_PX_RATIO}px`,
                      top: `${y * MM_TO_PX_RATIO}px`,
                      width: `${format.width * MM_TO_PX_RATIO}px`,
                      height: `${format.height * MM_TO_PX_RATIO}px`,
                    }}
                    onDrop={(e) => handleDrop(e, position)}
                    onDragOver={handleDragOver}
                    onClick={() => onSlotClick?.(position)}
                  >
                    {slotData ? (
                      <div className="p-2 h-full flex flex-col justify-between text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold truncate flex-1">
                            {slotData.productName}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSlot(position);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-primary font-bold">
                          {slotData.price?.toFixed(2)}€
                        </div>
                        <div className="text-[8px] text-muted-foreground truncate">
                          {slotData.barcode}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                        {position}
                      </div>
                    )}
                  </div>
                );
              })
            ))}
          </div>

          <div className="mt-4 flex justify-between text-sm text-muted-foreground">
            <span>{slots.length} / {totalSlots} emplacements remplis</span>
            <span>Total produits: {slots.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
