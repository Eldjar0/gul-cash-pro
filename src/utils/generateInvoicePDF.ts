import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export const generateInvoicePDF = (invoice: InvoiceData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // ============ LOGO (GAUCHE) ============
  try {
    const logoWidth = 50;
    const logoHeight = 25;
    doc.addImage(logoInvoice, 'PNG', 15, yPos, logoWidth, logoHeight);
  } catch (error) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.company.name, 15, yPos);
  }

  // ============ INFORMATIONS SOCIÉTÉ (DROITE) ============
  const rightX = pageWidth - 15;
  let rightY = yPos;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.company.name, rightX, rightY, { align: 'right' });
  rightY += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.company.address, rightX, rightY, { align: 'right' });
  rightY += 4;
  doc.text(`${invoice.company.postalCode} ${invoice.company.city}`, rightX, rightY, { align: 'right' });
  rightY += 4;
  
  if (invoice.company.email) {
    doc.text(invoice.company.email, rightX, rightY, { align: 'right' });
    rightY += 4;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text(`TVA: ${invoice.company.vatNumber}`, rightX, rightY, { align: 'right' });

  yPos = 55;

  // ============ TITRE FACTURE ============
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Facture', 15, yPos);
  yPos += 10;

  // ============ CLIENT (GAUCHE) ============
  if (invoice.customer) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
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
      yPos += 4;
    }
  }

  // ============ INFOS FACTURE (DROITE) ============
  let infoY = 65;
  const labelX = pageWidth - 75;
  const valueX = rightX;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Numéro de facture', labelX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.saleNumber, valueX, infoY, { align: 'right' });
  infoY += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date de facturation', labelX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr }), valueX, infoY, { align: 'right' });
  infoY += 5;
  
  if (invoice.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.text("Date d'échéance", labelX, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr }), valueX, infoY, { align: 'right' });
    infoY += 5;
  }
  
  if (invoice.customer?.vatNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text('Numéro TVA client', labelX, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.customer.vatNumber, valueX, infoY, { align: 'right' });
  }

  yPos = Math.max(yPos, infoY + 10);

  // ============ LIGNE SÉPARATRICE ============
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  // ============ TABLEAU DES ARTICLES ============
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)} €`,
    `${item.vatRate}%`,
    `${item.total.toFixed(2)} €`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Quantité', 'Prix unitaire', 'TVA', 'Total']],
    body: tableData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineWidth: { bottom: 0.5 },
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    didDrawPage: (data) => {
      yPos = data.cursor ? data.cursor.y : yPos;
    }
  });

  yPos += 10;

  // ============ RÉFÉRENCE DE PAIEMENT (BLEU) ============
  doc.setFillColor(0, 122, 204);
  const refBoxHeight = 15;
  doc.roundedRect(15, yPos, 80, refBoxHeight, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Référence de paiement', 18, yPos + 5);
  doc.setFontSize(11);
  doc.text(invoice.saleNumber, 18, yPos + 11);
  doc.setTextColor(0, 0, 0);

  // ============ TOTAUX (DROITE) ============
  const totalsX = pageWidth - 70;
  let totalsY = yPos + 2;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Montant imposable', totalsX, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${invoice.subtotal.toFixed(2)} €`, rightX, totalsY, { align: 'right' });
  totalsY += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.text('+ TVA (21%)', totalsX, totalsY);
  doc.setFont('helvetica', 'bold');
  doc.text(`${invoice.totalVat.toFixed(2)} €`, rightX, totalsY, { align: 'right' });
  totalsY += 2;
  
  doc.setLineWidth(0.5);
  doc.line(totalsX, totalsY, rightX, totalsY);
  totalsY += 6;
  
  doc.setFontSize(11);
  doc.text('Total', totalsX, totalsY);
  doc.text(`${invoice.total.toFixed(2)} €`, rightX, totalsY, { align: 'right' });

  yPos = Math.max(yPos + refBoxHeight + 10, totalsY + 10);

  // ============ NOTES ============
  if (invoice.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 30);
    doc.text(splitNotes, 15, yPos);
    yPos += splitNotes.length * 5 + 5;
  }

  // ============ CONDITIONS DE PAIEMENT ============
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 122, 204);
  
  let paymentText = '';
  if (invoice.dueDate) {
    const daysDiff = differenceInDays(new Date(invoice.dueDate), new Date(invoice.date));
    paymentText = `Paiement à ${daysDiff} jours - Date d'échéance: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}`;
  } else {
    paymentText = "Paiement à 30 jours";
  }
  
  doc.text(paymentText, pageWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  // ============ FOOTER ============
  const footerY = pageHeight - 30;
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(15, footerY, pageWidth - 15, footerY);
  
  yPos = footerY + 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  const col1X = 20;
  const col2X = 70;
  const col3X = 120;
  const col4X = 160;
  
  // Siège social
  doc.setFont('helvetica', 'bold');
  doc.text('Siège social', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.company.address, col1X, yPos + 4);
  doc.text(`${invoice.company.postalCode} ${invoice.company.city}`, col1X, yPos + 8);
  
  // Bureau
  doc.setFont('helvetica', 'bold');
  doc.text('Bureau', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.company.address, col2X, yPos + 4);
  doc.text(`${invoice.company.postalCode} ${invoice.company.city}`, col2X, yPos + 8);
  
  // Compte bancaire
  doc.setFont('helvetica', 'bold');
  doc.text('Compte bancaire', col3X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('IBAN à configurer', col3X, yPos + 4);
  
  // Questions
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