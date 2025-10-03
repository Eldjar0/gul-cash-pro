import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InvoiceData {
  saleNumber: string;
  date: Date;
  company: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    vatNumber: string;
    phone?: string;
  };
  customer?: {
    name: string;
    vatNumber?: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    subtotal: number;
    vatAmount: number;
    total: number;
  }>;
  subtotal: number;
  totalVat: number;
  total: number;
  notes?: string;
}

// SHOPCAISSE Blue Color (HSL: 210 100% 50%)
const PRIMARY_COLOR = { r: 0, g: 128, b: 255 };
const PRIMARY_LIGHT = { r: 230, g: 242, b: 255 };
const PRIMARY_DARK = { r: 0, g: 102, b: 204 };

export const generateInvoicePDF = (invoice: InvoiceData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 25;

  // ============ HEADER WITH BLUE BAND ============
  doc.setFillColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo (placeholder - will be replaced with actual logo)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 12, 30, 20, 2, 2, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.text('SHOP', 20, 22);
  doc.text('CAISSE', 18, 28);

  // Company Info in Header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(invoice.company.name, 50, 18);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.company.address, 50, 24);
  doc.text(`${invoice.company.postalCode} ${invoice.company.city}`, 50, 28);
  doc.text(`TVA: ${invoice.company.vatNumber}`, 50, 32);
  if (invoice.company.phone) {
    doc.text(`Tél: ${invoice.company.phone}`, 50, 36);
  }

  // Invoice Title & Info (Right side)
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('FACTURE', pageWidth - 15, 22, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.saleNumber, pageWidth - 15, 30, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(format(new Date(invoice.date), 'dd MMMM yyyy', { locale: fr }), pageWidth - 15, 36, { align: 'right' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // ============ CUSTOMER INFO SECTION ============
  yPos = 60;
  
  if (invoice.customer) {
    // Blue accent bar for customer section
    doc.setFillColor(PRIMARY_LIGHT.r, PRIMARY_LIGHT.g, PRIMARY_LIGHT.b);
    doc.roundedRect(15, yPos - 5, 90, 40, 3, 3, 'F');
    
    // Border
    doc.setDrawColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPos - 5, 90, 40, 3, 3, 'S');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PRIMARY_DARK.r, PRIMARY_DARK.g, PRIMARY_DARK.b);
    doc.text('FACTURÉ À', 20, yPos);
    yPos += 7;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.customer.name, 20, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (invoice.customer.vatNumber) {
      doc.text(`N° TVA: ${invoice.customer.vatNumber}`, 20, yPos);
      yPos += 5;
    }
    if (invoice.customer.address) {
      doc.text(invoice.customer.address, 20, yPos);
      yPos += 5;
    }
    if (invoice.customer.city) {
      doc.text(`${invoice.customer.postalCode || ''} ${invoice.customer.city}`, 20, yPos);
    }
  }

  // ============ ITEMS TABLE ============
  yPos = 110;
  
  // Table Header with blue background
  doc.setFillColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.roundedRect(15, yPos - 6, pageWidth - 30, 10, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION', 20, yPos);
  doc.text('QTÉ', 120, yPos, { align: 'center' });
  doc.text('PU HT', 145, yPos, { align: 'right' });
  doc.text('TVA', 165, yPos, { align: 'right' });
  doc.text('TOTAL TTC', pageWidth - 20, yPos, { align: 'right' });
  
  yPos += 8;
  doc.setTextColor(0, 0, 0);

  // Table Rows with alternating colors
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  invoice.items.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
    }

    const description = item.description.length > 45 
      ? item.description.substring(0, 42) + '...'
      : item.description;
    
    doc.text(description, 20, yPos);
    doc.text(item.quantity.toString(), 120, yPos, { align: 'center' });
    doc.text(`${item.unitPrice.toFixed(2)}€`, 145, yPos, { align: 'right' });
    doc.text(`${item.vatRate}%`, 165, yPos, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.total.toFixed(2)}€`, pageWidth - 20, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    yPos += 8;

    // Add new page if needed
    if (yPos > 250) {
      doc.addPage();
      yPos = 30;
    }
  });

  // ============ TOTALS SECTION ============
  yPos += 5;
  
  // Separator line
  doc.setDrawColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  const totalsX = pageWidth - 80;

  // Calculate VAT by rate
  const vatByRate: Record<number, number> = {};
  invoice.items.forEach((item) => {
    vatByRate[item.vatRate] = (vatByRate[item.vatRate] || 0) + item.vatAmount;
  });

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Total HT:', totalsX, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`${invoice.subtotal.toFixed(2)}€`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 7;

  // VAT breakdown
  doc.setFont('helvetica', 'normal');
  Object.entries(vatByRate).forEach(([rate, amount]) => {
    doc.text(`TVA ${rate}%:`, totalsX, yPos);
    doc.text(`${amount.toFixed(2)}€`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 7;
  });

  // Total TTC with blue highlight
  yPos += 3;
  doc.setFillColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.roundedRect(totalsX - 5, yPos - 7, 80, 12, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL TTC:', totalsX, yPos);
  doc.text(`${invoice.total.toFixed(2)}€`, pageWidth - 20, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // ============ NOTES SECTION ============
  if (invoice.notes) {
    yPos += 20;
    doc.setFillColor(PRIMARY_LIGHT.r, PRIMARY_LIGHT.g, PRIMARY_LIGHT.b);
    doc.roundedRect(15, yPos - 5, pageWidth - 30, 20, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PRIMARY_DARK.r, PRIMARY_DARK.g, PRIMARY_DARK.b);
    doc.text('NOTES:', 20, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(splitNotes, 20, yPos);
  }

  // ============ FOOTER ============
  const footerY = pageHeight - 15;
  
  // Blue line above footer
  doc.setDrawColor(PRIMARY_COLOR.r, PRIMARY_COLOR.g, PRIMARY_COLOR.b);
  doc.setLineWidth(1);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Facture générée automatiquement par SHOPCAISSE - Merci de votre confiance',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  return doc;
};

export const downloadInvoicePDF = (invoice: InvoiceData) => {
  const doc = generateInvoicePDF(invoice);
  const filename = `${invoice.saleNumber.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
};

export const previewInvoicePDF = (invoice: InvoiceData) => {
  const doc = generateInvoicePDF(invoice);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};
