import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import type { StickerFormat, LabelSlot } from '@/components/inventory/A4LabelLayout';

interface PrintConfig {
  format: StickerFormat;
  slots: LabelSlot[];
  template?: any;
  showCutLines?: boolean;
}

export const generateA4LabelsPDF = (config: PrintConfig) => {
  const { format, slots, showCutLines = true } = config;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Pour chaque slot assigné
  slots.forEach(slot => {
    if (!slot.productId || !slot.productName) return;

    const row = Math.floor((slot.position - 1) / format.columns);
    const col = (slot.position - 1) % format.columns;

    const x = format.marginLeft + col * (format.width + format.gapX);
    const y = format.marginTop + row * (format.height + format.gapY);

    // Bordure de l'étiquette
    if (showCutLines) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.rect(x, y, format.width, format.height);
    }

    // Contenu de l'étiquette
    const padding = 2;
    const contentX = x + padding;
    const contentY = y + padding;
    const contentWidth = format.width - 2 * padding;
    const contentHeight = format.height - 2 * padding;

    // Nom du produit (en haut)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const productNameLines = doc.splitTextToSize(slot.productName, contentWidth - 20);
    doc.text(productNameLines[0], contentX, contentY + 5);

    // Prix (en haut à droite)
    if (slot.price !== undefined) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const priceText = `${slot.price.toFixed(2)}€`;
      const priceWidth = doc.getTextWidth(priceText);
      doc.text(priceText, x + format.width - padding - priceWidth, contentY + 6);
    }

    // Code-barres (au centre)
    if (slot.barcode) {
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, slot.barcode, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: false,
          margin: 0,
        });

        const barcodeDataUrl = canvas.toDataURL('image/png');
        const barcodeHeight = 15;
        const barcodeY = y + format.height / 2 - barcodeHeight / 2;
        
        doc.addImage(
          barcodeDataUrl,
          'PNG',
          contentX,
          barcodeY,
          contentWidth * 0.8,
          barcodeHeight
        );

        // Numéro du code-barres
        doc.setFontSize(7);
        doc.setFont('courier', 'normal');
        doc.text(slot.barcode, contentX, barcodeY + barcodeHeight + 3);
      } catch (error) {
        console.error('Erreur génération code-barres:', error);
      }
    }

    // Info supplémentaire en bas
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const bottomY = y + format.height - padding - 2;
    
    if (slot.price !== undefined) {
      const vatRate = 21; // TODO: récupérer depuis le produit
      const priceHT = slot.price / (1 + vatRate / 100);
      const vatAmount = slot.price - priceHT;
      
      doc.text(`Prix: ${slot.price.toFixed(2)}€`, contentX, bottomY - 4);
      doc.text(`TVA ${vatRate}%: ${vatAmount.toFixed(2)}€`, contentX, bottomY);
    }
  });

  return doc;
};
