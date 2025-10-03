import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import logoJLProd from '../assets/logo-jlprod.png';

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

// Black & White Professional Colors for invoice
const BLACK = { r: 0, g: 0, b: 0 };
const GRAY_LIGHT = { r: 240, g: 240, b: 240 };
const GRAY_DARK = { r: 100, g: 100, b: 100 };

export const generateInvoicePDF = (invoice: InvoiceData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  let yPos = 20;

  // ============ LOGO CENTRÉ (EN COULEUR) ============
  try {
    const logoWidth = 50;
    const logoHeight = 35;
    doc.addImage(logoJLProd, 'PNG', centerX - logoWidth/2, yPos, logoWidth, logoHeight);
    yPos += logoHeight + 8;
  } catch (error) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
    doc.text('JL PROD', centerX, yPos, { align: 'center' });
    yPos += 10;
  }

  // ============ INFORMATIONS SOCIÉTÉ (CENTRÉ) ============
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  doc.text(invoice.company.address, centerX, yPos, { align: 'center' });
  yPos += 5;
  doc.text(`${invoice.company.postalCode} ${invoice.company.city}`, centerX, yPos, { align: 'center' });
  yPos += 5;
  if (invoice.company.phone) {
    doc.text(`Tel: ${invoice.company.phone}`, centerX, yPos, { align: 'center' });
    yPos += 5;
  }
  doc.text(`TVA: ${invoice.company.vatNumber}`, centerX, yPos, { align: 'center' });
  yPos += 8;

  // ============ LIGNE SÉPARATRICE ============
  doc.setDrawColor(BLACK.r, BLACK.g, BLACK.b);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  // ============ INFORMATIONS CLIENT ============
  if (invoice.customer) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT:', 15, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(invoice.customer.name, 15, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (invoice.customer.vatNumber) {
      doc.text(`TVA: ${invoice.customer.vatNumber}`, 15, yPos);
      yPos += 5;
    }
    if (invoice.customer.address) {
      doc.text(invoice.customer.address, 15, yPos);
      yPos += 5;
    }
    if (invoice.customer.city) {
      doc.text(`${invoice.customer.postalCode || ''} ${invoice.customer.city}`, 15, yPos);
      yPos += 5;
    }
    yPos += 3;
    
    // Ligne séparatrice
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 8;
  }

  // ============ NUMÉRO ET DATE FACTURE ============
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE N°:', 15, yPos);
  doc.text(invoice.saleNumber, 50, yPos);
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.text('DATE:', 15, yPos);
  doc.text(format(new Date(invoice.date), 'dd/MM/yyyy HH:mm', { locale: fr }), 50, yPos);
  yPos += 8;

  // Ligne séparatrice
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  // ============ ARTICLES ============
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  invoice.items.forEach((item, index) => {
    // Nom du produit et prix sur la même ligne
    const itemName = item.description.length > 50 
      ? item.description.substring(0, 47) + '...' 
      : item.description;
    
    doc.setFont('helvetica', 'bold');
    doc.text(itemName.toUpperCase(), 15, yPos);
    doc.text(`${item.total.toFixed(2)}€`, pageWidth - 15, yPos, { align: 'right' });
    yPos += 5;
    
    // Détails: quantité x prix unitaire
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${item.quantity} pc x ${item.unitPrice.toFixed(2)}€`, 15, yPos);
    yPos += 5;
    
    doc.setFontSize(10);
    yPos += 2;
    
    // Éviter débordement de page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
  });

  yPos += 3;

  // ============ LIGNE SÉPARATRICE TOTAUX ============
  doc.setDrawColor(BLACK.r, BLACK.g, BLACK.b);
  doc.setLineWidth(1);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  // ============ TOTAUX ============
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Sous-total HT
  doc.text('SOUS-TOTAL HT', 15, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`${invoice.subtotal.toFixed(2)}€`, pageWidth - 15, yPos, { align: 'right' });
  yPos += 6;
  
  // TVA par taux
  const vatByRate: Record<number, number> = {};
  invoice.items.forEach((item) => {
    vatByRate[item.vatRate] = (vatByRate[item.vatRate] || 0) + item.vatAmount;
  });
  
  doc.setFont('helvetica', 'normal');
  Object.entries(vatByRate).forEach(([rate, amount]) => {
    doc.text(`TVA ${rate}%`, 15, yPos);
    doc.text(`${amount.toFixed(2)}€`, pageWidth - 15, yPos, { align: 'right' });
    yPos += 6;
  });

  yPos += 2;

  // ============ TOTAL TTC (ENCADRÉ) ============
  doc.setFillColor(BLACK.r, BLACK.g, BLACK.b);
  doc.rect(15, yPos - 6, pageWidth - 30, 12, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL', 20, yPos);
  doc.text(`${invoice.total.toFixed(2)}€`, pageWidth - 20, yPos, { align: 'right' });
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  yPos += 12;

  // ============ MENTIONS LÉGALES OBLIGATOIRES (BELGIQUE) ============
  yPos += 10;
  
  doc.setFillColor(GRAY_LIGHT.r, GRAY_LIGHT.g, GRAY_LIGHT.b);
  const legalBoxHeight = 45;
  doc.rect(15, yPos, pageWidth - 30, legalBoxHeight, 'F');
  doc.setDrawColor(BLACK.r, BLACK.g, BLACK.b);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos, pageWidth - 30, legalBoxHeight, 'S');
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('MENTIONS LÉGALES', centerX, yPos, { align: 'center' });
  yPos += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  const legalTexts = [
    `Facture payable sous 30 jours à compter de la date d'émission`,
    `En cas de retard de paiement, des intérêts de retard au taux légal seront appliqués`,
    `TVA applicable: BE ${invoice.company.vatNumber}`,
    `Aucun escompte accordé en cas de paiement anticipé`,
  ];
  
  legalTexts.forEach(text => {
    const lines = doc.splitTextToSize(text, pageWidth - 40);
    doc.text(lines, centerX, yPos, { align: 'center' });
    yPos += 5;
  });

  // ============ NOTES ADDITIONNELLES ============
  if (invoice.notes) {
    yPos += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES:', 15, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 30);
    doc.text(splitNotes, 15, yPos);
  }

  // ============ FOOTER ============
  const footerY = pageHeight - 20;
  
  doc.setDrawColor(BLACK.r, BLACK.g, BLACK.b);
  doc.setLineWidth(0.5);
  doc.line(15, footerY, pageWidth - 15, footerY);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  doc.text('MERCI DE VOTRE CONFIANCE', centerX, footerY + 6, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY_DARK.r, GRAY_DARK.g, GRAY_DARK.b);
  doc.text('www.JLprod.be', centerX, footerY + 11, { align: 'center' });

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
