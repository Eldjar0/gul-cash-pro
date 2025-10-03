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

export const generateInvoicePDF = (invoice: InvoiceData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Company Info
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.company.name, 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.company.address, 20, yPos);
  yPos += 5;
  doc.text(`${invoice.company.postalCode} ${invoice.company.city}`, 20, yPos);
  yPos += 5;
  doc.text(`TVA: ${invoice.company.vatNumber}`, 20, yPos);
  if (invoice.company.phone) {
    yPos += 5;
    doc.text(`Tél: ${invoice.company.phone}`, 20, yPos);
  }

  // Invoice Title & Number
  yPos = 20;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185); // Primary color
  doc.text('FACTURE', pageWidth - 20, yPos, { align: 'right' });
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.saleNumber, pageWidth - 20, yPos, { align: 'right' });
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr }), pageWidth - 20, yPos, { align: 'right' });

  // Customer Info
  yPos = 70;
  if (invoice.customer) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURÉ À', 20, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customer.name, 20, yPos);
    yPos += 5;

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
      yPos += 5;
    }
  }

  // Items Table
  yPos = 115;
  
  // Table Header Background
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, 170, 8, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 22, yPos);
  doc.text('Qté', 115, yPos, { align: 'right' });
  doc.text('PU HT', 135, yPos, { align: 'right' });
  doc.text('TVA', 155, yPos, { align: 'right' });
  doc.text('Total TTC', 185, yPos, { align: 'right' });
  
  yPos += 3;
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  yPos += 7;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  invoice.items.forEach((item, index) => {
    // Alternate row background
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, yPos - 5, 170, 7, 'F');
    }

    const description = item.description.substring(0, 50);
    doc.text(description, 22, yPos);
    doc.text(item.quantity.toString(), 115, yPos, { align: 'right' });
    doc.text(`${item.unitPrice.toFixed(2)}€`, 135, yPos, { align: 'right' });
    doc.text(`${item.vatRate}%`, 155, yPos, { align: 'right' });
    doc.text(`${item.total.toFixed(2)}€`, 185, yPos, { align: 'right' });
    yPos += 7;

    // Add new page if needed
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
  });

  // Totals Section
  yPos += 5;
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  yPos += 10;

  const totalsX = 135;

  // Calculate VAT by rate
  const vatByRate: Record<number, number> = {};
  invoice.items.forEach((item) => {
    vatByRate[item.vatRate] = (vatByRate[item.vatRate] || 0) + item.vatAmount;
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Total HT:', totalsX, yPos);
  doc.text(`${invoice.subtotal.toFixed(2)}€`, 185, yPos, { align: 'right' });
  yPos += 6;

  Object.entries(vatByRate).forEach(([rate, amount]) => {
    doc.text(`TVA ${rate}%:`, totalsX, yPos);
    doc.text(`${amount.toFixed(2)}€`, 185, yPos, { align: 'right' });
    yPos += 6;
  });

  // Total TTC
  yPos += 2;
  doc.setFillColor(41, 128, 185);
  doc.rect(totalsX - 5, yPos - 6, 60, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Total TTC:', totalsX, yPos);
  doc.text(`${invoice.total.toFixed(2)}€`, 185, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // Notes
  if (invoice.notes) {
    yPos += 20;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(invoice.notes, 170);
    doc.text(splitNotes, 20, yPos);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Facture générée automatiquement - Merci de votre confiance',
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
