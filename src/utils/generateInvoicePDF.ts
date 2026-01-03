import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import QRCode from 'qrcode';
import logoInvoice from '../assets/logo-invoice.png';

interface BankAccount {
  bank_name: string;
  account_number: string;
}

interface InvoiceData {
  saleNumber: string;
  date: Date;
  dueDate?: Date;
  structuredCommunication?: string;
  isPaid?: boolean;
  bankAccounts?: BankAccount[];
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

export const generateInvoicePDF = async (invoice: InvoiceData): Promise<jsPDF> => {
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
    
    if (invoice.customer.vatNumber) {
      doc.text(`TVA: ${invoice.customer.vatNumber}`, 15, yPos);
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

  // ============ RÉFÉRENCE (SIMPLE CADRE BLEU) ============
  doc.setFillColor(0, 122, 204);
  const refBoxHeight = 20;
  
  doc.roundedRect(15, yPos, 80, refBoxHeight, 2, 2, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Référence', 18, yPos + 7);
  doc.setFontSize(10);
  doc.text(invoice.saleNumber, 18, yPos + 14);
  
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

  // Constante pour la zone du footer
  const footerStartY = pageHeight - 50;

  // Fonction helper pour gérer les sauts de page
  const checkAndAddPage = (requiredSpace: number): boolean => {
    if (yPos + requiredSpace > footerStartY) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // ============ STATUT DE PAIEMENT ============
  if (invoice.isPaid) {
    checkAndAddPage(30);
    yPos += 10;
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 122, 204);
    doc.text('PAYÉ', pageWidth / 2, yPos, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 15;
  }

  // ============ INFORMATIONS DE PAIEMENT (ENCADRÉ ÉLÉGANT) ============
  if (!invoice.isPaid && invoice.bankAccounts && invoice.bankAccounts.length > 0) {
    checkAndAddPage(45);
    yPos += 10;
    
    // Cadre avec bordure
    doc.setDrawColor(0, 122, 204);
    doc.setLineWidth(0.8);
    doc.roundedRect(15, yPos, pageWidth - 30, 28, 2, 2);
    
    // Fond légèrement coloré
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(15, yPos, pageWidth - 30, 28, 2, 2, 'F');
    doc.setDrawColor(0, 122, 204);
    doc.roundedRect(15, yPos, pageWidth - 30, 28, 2, 2, 'S');
    
    let paymentY = yPos + 8;
    
    // Titre
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 122, 204);
    doc.text('Informations de paiement', 20, paymentY);
    paymentY += 7;
    
    // Informations en colonnes
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const account = invoice.bankAccounts[0];
    const col1 = 20;
    const col2 = 90;
    const col3 = 140;
    
    // Colonne 1: Banque et IBAN
    doc.text(`Banque: ${account.bank_name}`, col1, paymentY);
    doc.text(`IBAN: ${account.account_number}`, col1, paymentY + 5);
    
    // Colonne 2: Montant et Communication
    doc.setFont('helvetica', 'bold');
    doc.text(`Montant: ${invoice.total.toFixed(2)} €`, col2, paymentY);
    doc.setFont('helvetica', 'normal');
    if (invoice.structuredCommunication) {
      doc.text(`Communication: ${invoice.structuredCommunication}`, col2, paymentY + 5);
    }
    
    // Colonne 3: Échéance
    if (invoice.dueDate) {
      const daysDiff = differenceInDays(new Date(invoice.dueDate), new Date(invoice.date));
      doc.text(`Paiement à ${daysDiff} jours`, col3, paymentY);
      doc.text(`Échéance: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}`, col3, paymentY + 5);
    }
    
    doc.setTextColor(0, 0, 0);
    yPos += 35;
  }

  // ============ NOTES ============
  if (invoice.notes) {
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 30);
    const notesHeight = splitNotes.length * 5 + 15;
    checkAndAddPage(notesHeight);
    yPos += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(splitNotes, 15, yPos);
    yPos += splitNotes.length * 5 + 5;
  }

  // ============ QR CODE PAIEMENT ============
  if (!invoice.isPaid && invoice.bankAccounts && invoice.bankAccounts.length > 0) {
    const account = invoice.bankAccounts[0];
    
    // Format EPC QR Code (European Payments Council) pour virement SEPA
    const epcData = [
      'BCD',                                    // Service Tag
      '002',                                    // Version
      '1',                                      // Character set (UTF-8)
      'SCT',                                    // Identification (SEPA Credit Transfer)
      '',                                       // BIC (optional)
      invoice.company.name.substring(0, 70),   // Beneficiary name (max 70 chars)
      account.account_number.replace(/\s/g, ''), // IBAN
      `EUR${invoice.total.toFixed(2)}`,        // Amount
      '',                                       // Purpose code (optional)
      invoice.structuredCommunication || invoice.saleNumber, // Reference
      '',                                       // Unstructured reference
      ''                                        // Information
    ].join('\n');
    
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(epcData, {
        width: 80,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
      
      // Position du QR code en bas à droite
      const qrSize = 28;
      const qrX = pageWidth - 15 - qrSize;
      const qrY = pageHeight - 55;
      
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      
      // Label sous le QR code
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Scanner pour payer', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
    } catch (error) {
      console.error('Erreur génération QR code:', error);
    }
  }

  // ============ FOOTER AMÉLIORÉ ============
  const footerY = pageHeight - 52;
  
  // Ligne de séparation avec dégradé visuel
  doc.setDrawColor(0, 122, 204);
  doc.setLineWidth(0.8);
  doc.line(15, footerY, pageWidth - 15, footerY);
  
  yPos = footerY + 6;
  
  // Fond légèrement coloré pour le footer
  doc.setFillColor(248, 250, 252);
  doc.rect(15, footerY + 1, pageWidth - 30, 38, 'F');
  
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  
  const col1X = 20;
  const col2X = 65;
  const col3X = 115;
  
  // Colonne 1: Siège social
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 122, 204);
  doc.text('Siège social', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(invoice.company.address, col1X, yPos + 5);
  doc.text(`${invoice.company.postalCode} ${invoice.company.city}`, col1X, yPos + 10);
  if (invoice.company.phone) {
    doc.text(`Tél: ${invoice.company.phone}`, col1X, yPos + 15);
  }
  
  // Colonne 2: Contact
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 122, 204);
  doc.text('Contact', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  if (invoice.company.email) {
    doc.text(invoice.company.email, col2X, yPos + 5);
  }
  doc.text(`TVA: ${invoice.company.vatNumber}`, col2X, yPos + 10);
  
  // Colonne 3: Banque
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 122, 204);
  doc.text('Coordonnées bancaires', col3X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  if (invoice.bankAccounts && invoice.bankAccounts.length > 0) {
    doc.text(invoice.bankAccounts[0].bank_name, col3X, yPos + 5);
    doc.text(invoice.bankAccounts[0].account_number, col3X, yPos + 10);
  }

  // Mention légale en bas
  yPos = pageHeight - 8;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text('Document à conserver 10 ans conformément à l\'Art. 315bis CIR92 - Facture générée électroniquement', pageWidth / 2, yPos, { align: 'center' });

  return doc;
};

export const downloadInvoicePDF = async (invoice: InvoiceData) => {
  const doc = await generateInvoicePDF(invoice);
  const filename = `${invoice.saleNumber.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
};

export const getInvoicePDFBlob = async (invoice: InvoiceData): Promise<Blob> => {
  const doc = await generateInvoicePDF(invoice);
  return doc.output('blob');
};

export const getInvoicePDFFilename = (invoice: InvoiceData): string => {
  return `${invoice.saleNumber.replace(/\//g, '-')}.pdf`;
};

export const previewInvoicePDF = async (invoice: InvoiceData) => {
  const doc = await generateInvoicePDF(invoice);
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