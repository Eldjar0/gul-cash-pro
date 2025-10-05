import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Product {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  stock?: number;
  unit?: string;
  min_stock?: number;
  vat_rate?: number;
  category_id?: string;
  is_active?: boolean;
}

export const generateStockPDF = (products: Product[]) => {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // En-tête
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉTAT DES STOCKS', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Généré le ${dateStr}`, pageWidth / 2, 30, { align: 'center' });
  
  // Statistiques
  const activeProducts = products.filter(p => p.is_active !== false);
  const totalValue = activeProducts.reduce((sum, p) => sum + ((p.stock || 0) * p.price), 0);
  const totalCost = activeProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost_price || 0)), 0);
  const lowStock = activeProducts.filter(p => (p.stock || 0) <= (p.min_stock || 0) && (p.stock || 0) > 0).length;
  const outOfStock = activeProducts.filter(p => (p.stock || 0) === 0).length;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  const statsY = 50;
  const statsSpacing = (pageWidth - 40) / 4;
  
  // Box pour chaque stat
  const statBoxWidth = statsSpacing - 5;
  
  // Total produits
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(15, statsY, statBoxWidth, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(activeProducts.length.toString(), 15 + statBoxWidth / 2, statsY + 10, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Produits actifs', 15 + statBoxWidth / 2, statsY + 16, { align: 'center' });
  
  // Valeur stock
  doc.setFillColor(34, 197, 94);
  doc.roundedRect(15 + statsSpacing, statsY, statBoxWidth, 20, 3, 3, 'F');
  doc.setFontSize(14);
  doc.text(`${totalValue.toFixed(0)}€`, 15 + statsSpacing + statBoxWidth / 2, statsY + 10, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Valeur totale', 15 + statsSpacing + statBoxWidth / 2, statsY + 16, { align: 'center' });
  
  // Stock faible
  doc.setFillColor(251, 146, 60);
  doc.roundedRect(15 + statsSpacing * 2, statsY, statBoxWidth, 20, 3, 3, 'F');
  doc.setFontSize(16);
  doc.text(lowStock.toString(), 15 + statsSpacing * 2 + statBoxWidth / 2, statsY + 10, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Stock faible', 15 + statsSpacing * 2 + statBoxWidth / 2, statsY + 16, { align: 'center' });
  
  // Rupture
  doc.setFillColor(239, 68, 68);
  doc.roundedRect(15 + statsSpacing * 3, statsY, statBoxWidth, 20, 3, 3, 'F');
  doc.setFontSize(16);
  doc.text(outOfStock.toString(), 15 + statsSpacing * 3 + statBoxWidth / 2, statsY + 10, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Rupture', 15 + statsSpacing * 3 + statBoxWidth / 2, statsY + 16, { align: 'center' });
  
  // Tableau principal
  const tableData = activeProducts.map(product => {
    const stock = product.stock || 0;
    const unit = product.unit || 'unité';
    const vatRate = product.vat_rate || 0;
    const stockValue = stock * product.price;
    const margin = product.cost_price ? ((product.price - product.cost_price) / product.price * 100) : 0;
    const stockStatus = stock === 0 ? '🔴 Rupture' : 
                       stock <= (product.min_stock || 0) ? '🟠 Faible' : 
                       '🟢 OK';
    
    return [
      product.name,
      product.barcode || '-',
      `${stock} ${unit}`,
      product.min_stock?.toString() || '-',
      `${product.price.toFixed(2)}€`,
      product.cost_price ? `${product.cost_price.toFixed(2)}€` : '-',
      `${margin.toFixed(1)}%`,
      `${stockValue.toFixed(2)}€`,
      `${vatRate}%`,
      stockStatus
    ];
  });
  
  autoTable(doc, {
    startY: 80,
    head: [['Produit', 'Code-barres', 'Stock', 'Min', 'Prix vente', 'Prix achat', 'Marge', 'Valeur', 'TVA', 'Statut']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 50, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 30, fontStyle: 'normal', font: 'courier' },
      2: { cellWidth: 22 },
      3: { cellWidth: 15 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 18 },
      7: { cellWidth: 22, fontStyle: 'bold' },
      8: { cellWidth: 15 },
      9: { cellWidth: 25 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (data) => {
      // Pied de page
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${data.pageNumber} sur ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      
      // Totaux sur dernière page
      if (data.pageNumber === pageCount) {
        const finalY = (data as any).finalY || pageHeight - 30;
        
        doc.setFillColor(240, 240, 240);
        doc.rect(14, finalY + 10, pageWidth - 28, 15, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`VALEUR TOTALE DU STOCK: ${totalValue.toFixed(2)}€`, 20, finalY + 18);
        doc.text(`COÛT TOTAL: ${totalCost.toFixed(2)}€`, 20, finalY + 23);
        
        const profit = totalValue - totalCost;
        doc.text(`MARGE POTENTIELLE: ${profit.toFixed(2)}€`, pageWidth - 20, finalY + 18, { align: 'right' });
        
        const profitPercent = totalCost > 0 ? (profit / totalCost * 100) : 0;
        doc.text(`TAUX DE MARGE: ${profitPercent.toFixed(1)}%`, pageWidth - 20, finalY + 23, { align: 'right' });
      }
    }
  });
  
  doc.save(`stock_${new Date().toISOString().split('T')[0]}.pdf`);
};
