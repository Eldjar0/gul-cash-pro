import jsPDF from 'jspdf';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import logoInvoice from '../assets/logo-invoice.png';

interface InvoiceData {
  saleNumber: string;
  date: Date;
  dueDate?: Date;
  company: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    vatNumber: string;
    phone?: string;
    email?: string;
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

  // ============ LOGO ============
  try {
    const logoWidth = 60;
    const logoHeight = 30;
    doc.addImage(logoInvoice, 'PNG', 15, yPos, logoWidth, logoHeight);
    yPos += logoHeight + 5;
  } catch (error) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
    doc.text(invoice.company.name, 15, yPos);
    yPos += 10;
  }

  // ============ INFORMATIONS SOCIÉTÉ (DROITE) ============
  yPos = 20;
  const rightX = pageWidth - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  doc.text(invoice.company.name, rightX, yPos, { align: 'right' });
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.company.address, rightX, yPos, { align: 'right' });
  yPos += 4;
  doc.text(`${invoice.company.postalCode} ${invoice.company.city}`, rightX, yPos, { align: 'right' });
  yPos += 4;
  if (invoice.company.email) {
    doc.text(invoice.company.email, rightX, yPos, { align: 'right' });
    yPos += 4;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`TVA: ${invoice.company.vatNumber}`, rightX, yPos, { align: 'right' });
  yPos += 10;

  // Position après les infos société
  yPos = Math.max(yPos, 65);

  // ============ TITRE FACTURE ============
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Facture', 15, yPos);
  yPos += 8;

  // ============ INFORMATIONS CLIENT ============
  if (invoice.customer) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(invoice.customer.name, 15, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (invoice.customer.address) {
      doc.text(invoice.customer.address, 15, yPos);
      yPos += 4;
    }
    if (invoice.customer.city) {
      doc.text(`${invoice.customer.postalCode || ''} ${invoice.customer.city}`, 15, yPos);
      yPos += 5;
    }
    yPos += 3;
  }

  // ============ NUMÉRO ET DATES FACTURE (DROITE) ============
  const infoStartY = 73;
  let infoY = infoStartY;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Numéro de facture', rightX - 45, infoY, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.saleNumber, rightX, infoY, { align: 'right' });
  infoY += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date de facturation', rightX - 45, infoY, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr }), rightX, infoY, { align: 'right' });
  infoY += 5;
  
  if (invoice.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.text("Date d'échéance", rightX - 45, infoY, { align: 'left' });
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr }), rightX, infoY, { align: 'right' });
    infoY += 5;
  }
  
  if (invoice.customer?.vatNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text('Numéro TVA client', rightX - 45, infoY, { align: 'left' });
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.customer.vatNumber, rightX, infoY, { align: 'right' });
  }

  yPos = Math.max(yPos, infoY + 10);

  // Ligne séparatrice
  doc.setDrawColor(BLACK.r, BLACK.g, BLACK.b);
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

  // ============ RÉFÉRENCE DE PAIEMENT ============
  yPos += 5;
  doc.setFillColor(0, 122, 204); // Couleur bleue
  const refBoxHeight = 15;
  doc.rect(15, yPos, 80, refBoxHeight, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Référence de paiement', 18, yPos + 5);
  doc.setFontSize(11);
  doc.text(invoice.saleNumber, 18, yPos + 11);
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  
  yPos += refBoxHeight + 10;

  // ============ CONDITIONS DE PAIEMENT ============
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  let paymentText = '';
  if (invoice.dueDate) {
    const daysDiff = differenceInDays(new Date(invoice.dueDate), new Date(invoice.date));
    paymentText = `Paiement à ${daysDiff} jours - Date d'échéance: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}`;
  } else {
    paymentText = "Paiement à 30 jours à compter de la date d'émission";
  }
  
  doc.text(paymentText, centerX, yPos, { align: 'center' });
  yPos += 8;

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
  const footerY = pageHeight - 30;
  
  doc.setDrawColor(BLACK.r, BLACK.g, BLACK.b);
  doc.setLineWidth(0.5);
  doc.line(15, footerY, pageWidth - 15, footerY);
  
  yPos = footerY + 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY_DARK.r, GRAY_DARK.g, GRAY_DARK.b);
  
  const col1X = 20;
  const col2X = 70;
  const col3X = 120;
  const col4X = 160;
  
  // Colonne 1: Siège social
  doc.setFont('helvetica', 'bold');
  doc.text('Siège social', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.company.address, col1X, yPos + 4);
  doc.text(`${invoice.company.postalCode} ${invoice.company.city}`, col1X, yPos + 8);
  
  // Colonne 2: Bureau
  doc.setFont('helvetica', 'bold');
  doc.text('Bureau', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.company.address, col2X, yPos + 4);
  doc.text(`${invoice.company.postalCode} ${invoice.company.city}`, col2X, yPos + 8);
  
  // Colonne 3: Compte bancaire
  doc.setFont('helvetica', 'bold');
  doc.text('Compte bancaire', col3X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('IBAN à configurer', col3X, yPos + 4);
  
  // Colonne 4: Questions
  doc.setFont('helvetica', 'bold');
  doc.text('Questions ?', col4X, yPos);
  doc.setFont('helvetica', 'normal');
  if (invoice.company.phone) {
    doc.text(invoice.company.phone, col4X, yPos + 4);
  }
  if (invoice.company.email) {
    doc.text(invoice.company.email, col4X, yPos + 8);
  }

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
  
  // Créer un lien temporaire pour éviter le blocage par le navigateur
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  
  // Ajouter au DOM, cliquer, puis supprimer
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Nettoyer l'URL après un délai
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
};
