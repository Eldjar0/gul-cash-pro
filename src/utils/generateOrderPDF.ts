import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Product {
  id: string;
  name: string;
  barcode?: string;
  stock?: number;
  min_stock?: number;
  price: number;
  cost_price?: number;
  unit?: string;
}

export const generateOrderPDF = (products: Product[]) => {
  const lowStockProducts = products.filter(p => (p.stock || 0) <= (p.min_stock || 0));
  
  if (lowStockProducts.length === 0) {
    return null;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // En-tete principal
  doc.setFillColor(239, 68, 68);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('BON DE COMMANDE', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Produits a reapprovisionner', pageWidth / 2, 30, { align: 'center' });
  
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.setFontSize(10);
  doc.text(`Date: ${dateStr}`, pageWidth / 2, 38, { align: 'center' });
  
  // Statistiques d'alerte
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  const outOfStock = lowStockProducts.filter(p => (p.stock || 0) === 0).length;
  const lowStock = lowStockProducts.filter(p => (p.stock || 0) > 0).length;
  
  doc.setFillColor(255, 240, 240);
  doc.rect(14, 55, pageWidth - 28, 20, 'F');
  
  doc.setTextColor(239, 68, 68);
  doc.text(`ATTENTION: ${lowStockProducts.length} produit(s) necessitent un reapprovisionnement`, 20, 63);
  
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Rupture: ${outOfStock}`, 20, 70);
  doc.text(`Stock faible: ${lowStock}`, pageWidth - 20, 70, { align: 'right' });
  
  // Tableau des produits a commander
  const tableData = lowStockProducts.map(product => {
    const stock = product.stock || 0;
    const minStock = product.min_stock || 0;
    const quantityToOrder = Math.max(minStock * 2 - stock, minStock);
    const estimatedCost = quantityToOrder * (product.cost_price || product.price);
    const unit = product.unit || 'unite';
    
    return [
      product.name,
      product.barcode || '-',
      `${stock} ${unit}`,
      `${minStock} ${unit}`,
      `${quantityToOrder} ${unit}`,
      product.cost_price ? `${product.cost_price.toFixed(2)} EUR` : `${product.price.toFixed(2)} EUR`,
      `${estimatedCost.toFixed(2)} EUR`
    ];
  });
  
  autoTable(doc, {
    startY: 85,
    head: [['Produit', 'Code-barres', 'Stock actuel', 'Stock min.', 'Qte a commander', 'Prix unit.', 'Cout total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [239, 68, 68],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.5,
      lineColor: [200, 200, 200]
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak',
      halign: 'center',
      lineWidth: 0.3,
      lineColor: [220, 220, 220]
    },
    columnStyles: {
      0: { cellWidth: 45, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 28, font: 'helvetica', fontSize: 8 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 25, fontStyle: 'bold' },
      5: { cellWidth: 20 },
      6: { cellWidth: 20, fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [252, 248, 248]
    },
    didDrawPage: (data) => {
      // Pied de page
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${data.pageNumber} / ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      
      // Total sur derniere page
      if (data.pageNumber === pageCount) {
        const finalY = (data as any).finalY || pageHeight - 50;
        
        const totalCost = lowStockProducts.reduce((sum, p) => {
          const stock = p.stock || 0;
          const minStock = p.min_stock || 0;
          const quantityToOrder = Math.max(minStock * 2 - stock, minStock);
          return sum + (quantityToOrder * (p.cost_price || p.price));
        }, 0);
        
        doc.setFillColor(239, 68, 68);
        doc.rect(14, finalY + 10, pageWidth - 28, 15, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`COUT TOTAL ESTIME: ${totalCost.toFixed(2)} EUR`, pageWidth / 2, finalY + 20, { align: 'center' });
        
        // Section notes
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Notes:', 20, finalY + 35);
        doc.line(20, finalY + 37, pageWidth - 20, finalY + 37);
        doc.line(20, finalY + 45, pageWidth - 20, finalY + 45);
        doc.line(20, finalY + 53, pageWidth - 20, finalY + 53);
        
        // Section signature
        doc.setFontSize(8);
        doc.text('Commande preparee par:', 20, finalY + 65);
        doc.text('Validee par:', pageWidth / 2 + 10, finalY + 65);
        
        doc.line(20, finalY + 75, 80, finalY + 75);
        doc.line(pageWidth / 2 + 10, finalY + 75, pageWidth - 20, finalY + 75);
        
        doc.setFontSize(7);
        doc.setTextColor(128);
        doc.text('Signature', 45, finalY + 78);
        doc.text('Signature', pageWidth / 2 + 50, finalY + 78);
      }
    }
  });
  
  doc.save(`bon-commande-${new Date().toISOString().split('T')[0]}.pdf`);
  return true;
};
