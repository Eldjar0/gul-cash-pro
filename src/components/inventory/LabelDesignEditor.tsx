import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, FabricImage, Text, Rect } from 'fabric';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Type, Image, Square, Trash2, Save, RotateCcw } from 'lucide-react';
import JsBarcode from 'jsbarcode';

interface LabelDesignEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labelSize: '7x3cm' | 'small' | 'medium' | 'large' | 'custom';
  customWidth?: number;
  customHeight?: number;
  onSaveTemplate: (template: any) => void;
  currentTemplate?: any;
}

export const LabelDesignEditor = ({ 
  open, 
  onOpenChange, 
  labelSize,
  customWidth,
  customHeight,
  onSaveTemplate,
  currentTemplate 
}: LabelDesignEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [fontSize, setFontSize] = useState(14);
  const [textColor, setTextColor] = useState('#000000');

  const labelSizes = {
    '7x3cm': { width: 265, height: 113 }, // 70mm x 30mm en pixels (96 DPI)
    small: { width: 227, height: 151 },   // 60mm x 40mm
    medium: { width: 302, height: 189 },  // 80mm x 50mm
    large: { width: 378, height: 227 },   // 100mm x 60mm
    custom: { 
      width: customWidth ? Math.round(customWidth * 3.78) : 265, 
      height: customHeight ? Math.round(customHeight * 3.78) : 113 
    } // Conversion mm vers pixels (96 DPI)
  };

  const size = labelSizes[labelSize];

  useEffect(() => {
    if (!canvasRef.current || !open) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: size.width,
      height: size.height,
      backgroundColor: '#ffffff',
    });

    setFabricCanvas(canvas);

    // Charger le template existant ou créer un template par défaut
    if (currentTemplate) {
      canvas.loadFromJSON(currentTemplate, () => {
        canvas.renderAll();
      });
    } else {
      // Template par défaut
      addDefaultTemplate(canvas);
    }

    canvas.on('selection:created', (e: any) => {
      setSelectedObject(e.selected[0]);
      updateControlsFromObject(e.selected[0]);
    });

    canvas.on('selection:updated', (e: any) => {
      setSelectedObject(e.selected[0]);
      updateControlsFromObject(e.selected[0]);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    return () => {
      canvas.dispose();
    };
  }, [open, labelSize]);

  const updateControlsFromObject = (obj: any) => {
    if (obj.type === 'text' || obj.type === 'i-text') {
      setFontSize(obj.fontSize || 14);
      setTextColor(obj.fill || '#000000');
    }
  };

  const addDefaultTemplate = (canvas: FabricCanvas) => {
    // Bordure
    const border = new Rect({
      left: 5,
      top: 5,
      width: size.width - 10,
      height: size.height - 10,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 2,
      selectable: false,
      name: 'border'
    });
    canvas.add(border);

    // Placeholder pour le nom du produit
    const productName = new Text('{{NOM_PRODUIT}}', {
      left: size.width / 2,
      top: 30,
      fontSize: 16,
      fontWeight: 'bold',
      fill: '#000000',
      originX: 'center',
      name: 'productName'
    });
    canvas.add(productName);

    // Placeholder pour le prix
    const price = new Text('{{PRIX}}€', {
      left: size.width - 20,
      top: size.height - 60,
      fontSize: 24,
      fontWeight: 'bold',
      fill: '#000000',
      originX: 'right',
      name: 'price'
    });
    canvas.add(price);

    // Placeholder pour le code-barres  
    const barcodeCanvas = document.createElement('canvas');
    JsBarcode(barcodeCanvas, '1234567890', {
      format: 'CODE128',
      width: 1.5,
      height: 40,
      displayValue: false,
      margin: 0
    });

    const barcodeDataUrl = barcodeCanvas.toDataURL('image/png');
    const imgElement = document.createElement('img');
    imgElement.onload = () => {
      const fabricImg = new FabricImage(imgElement, {
        left: 20,
        top: size.height - 80,
        scaleX: 0.8,
        scaleY: 0.8,
        name: 'barcode'
      });
      canvas.add(fabricImg);
      canvas.renderAll();
    };
    imgElement.src = barcodeDataUrl;

    // Texte pour le code-barres
    const barcodeText = new Text('{{CODE_BARRE}}', {
      left: 20,
      top: size.height - 30,
      fontSize: 8,
      fill: '#000000',
      name: 'barcodeText'
    });
    canvas.add(barcodeText);
  };

  const addText = () => {
    if (!fabricCanvas) return;
    
    const text = new Text('Nouveau texte', {
      left: 50,
      top: 50,
      fontSize: 14,
      fill: '#000000'
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    toast.success('Texte ajouté');
  };

  const addRectangle = () => {
    if (!fabricCanvas) return;
    
    const rect = new Rect({
      left: 50,
      top: 50,
      width: 80,
      height: 40,
      fill: '#f0f0f0',
      stroke: '#000000',
      strokeWidth: 1
    });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    toast.success('Rectangle ajouté');
  };

  const deleteSelected = () => {
    if (!fabricCanvas || !selectedObject) return;
    
    fabricCanvas.remove(selectedObject);
    toast.success('Élément supprimé');
  };

  const updateFontSize = (value: number[]) => {
    if (!fabricCanvas || !selectedObject) return;
    
    const newSize = value[0];
    setFontSize(newSize);
    selectedObject.set({ fontSize: newSize });
    fabricCanvas.renderAll();
  };

  const updateTextColor = (color: string) => {
    if (!fabricCanvas || !selectedObject) return;
    
    setTextColor(color);
    selectedObject.set({ fill: color });
    fabricCanvas.renderAll();
  };

  const saveTemplate = () => {
    if (!fabricCanvas) return;
    
    const json = JSON.stringify(fabricCanvas.toJSON());
    onSaveTemplate(json);
    toast.success('Design sauvegardé !');
    onOpenChange(false);
  };

  const resetTemplate = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    addDefaultTemplate(fabricCanvas);
    toast.success('Design réinitialisé');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Éditeur de design d'étiquettes</DialogTitle>
          <DialogDescription>
            Personnalisez le design de vos étiquettes. Utilisez les variables pour les données dynamiques (voir liste ci-dessous).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Barre d'outils */}
          <div className="space-y-4 lg:col-span-1">
            <div>
              <h3 className="font-semibold mb-3">Outils</h3>
              <div className="space-y-2">
                <Button onClick={addText} className="w-full justify-start" variant="outline">
                  <Type className="h-4 w-4 mr-2" />
                  Ajouter texte
                </Button>
                <Button onClick={addRectangle} className="w-full justify-start" variant="outline">
                  <Square className="h-4 w-4 mr-2" />
                  Ajouter rectangle
                </Button>
                <Button 
                  onClick={deleteSelected} 
                  className="w-full justify-start" 
                  variant="outline"
                  disabled={!selectedObject}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>

            {selectedObject && (selectedObject.type === 'text' || selectedObject.type === 'i-text') && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Propriétés du texte</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Taille de police: {fontSize}px</Label>
                    <Slider
                      value={[fontSize]}
                      onValueChange={updateFontSize}
                      min={8}
                      max={48}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Couleur</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => updateTextColor(e.target.value)}
                        className="w-full h-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Variables disponibles</h3>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p className="font-mono">• {'{{NOM_PRODUIT}}'}</p>
                <p className="font-mono">• {'{{PRIX}}'} - Prix TTC</p>
                <p className="font-mono">• {'{{PRIX_UNIT}}'} - Prix par unité</p>
                <p className="font-mono">• {'{{CODE_BARRE}}'}</p>
                <p className="font-mono">• {'{{TVA}}'} - Taux de TVA</p>
                <p className="font-mono">• {'{{UNITE}}'} - Unité de mesure</p>
                <p className="font-mono">• {'{{STOCK}}'} - Quantité en stock</p>
                <p className="font-mono">• {'{{CATEGORIE}}'}</p>
              </div>
              <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                <p className="text-muted-foreground">
                  Ces variables seront remplacées automatiquement par les données du produit lors de l'impression.
                </p>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center min-h-[400px]">
              <div className="bg-white shadow-lg" style={{ padding: '20px' }}>
                <canvas ref={canvasRef} />
              </div>
            </div>

            <div className="flex gap-2 mt-4 justify-end">
              <Button onClick={resetTemplate} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button onClick={saveTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder le design
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
