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

  // ============ INFORMATIONS DE PAIEMENT + QR CODE ============
  if (!invoice.isPaid && invoice.bankAccounts && invoice.bankAccounts.length > 0) {
    checkAndAddPage(50);
    yPos += 10;
    
    const account = invoice.bankAccounts[0];
    const boxWidth = pageWidth - 70; // Espace pour le QR code
    
    // Cadre avec bordure
    doc.setDrawColor(0, 122, 204);
    doc.setLineWidth(0.8);
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(15, yPos, boxWidth, 32, 2, 2, 'FD');
    
    let paymentY = yPos + 8;
    
    // Titre
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 122, 204);
    doc.text('Informations de paiement', 20, paymentY);
    paymentY += 8;
    
    // Informations en colonnes
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    
    const payCol1 = 20;
    const payCol2 = 75;
    
    // Colonne 1: Banque et IBAN
    doc.setFont('helvetica', 'normal');
    doc.text(`Banque: ${account.bank_name}`, payCol1, paymentY);
    doc.text(`IBAN: ${account.account_number}`, payCol1, paymentY + 5);
    if (invoice.structuredCommunication) {
      doc.text(`Communication: ${invoice.structuredCommunication}`, payCol1, paymentY + 10);
    }
    
    // Colonne 2: Montant et Échéance
    doc.setFont('helvetica', 'bold');
    doc.text(`Montant: ${invoice.total.toFixed(2)} €`, payCol2, paymentY);
    doc.setFont('helvetica', 'normal');
    if (invoice.dueDate) {
      const daysDiff = differenceInDays(new Date(invoice.dueDate), new Date(invoice.date));
      doc.text(`Paiement à ${daysDiff} jours`, payCol2, paymentY + 5);
      doc.text(`Échéance: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}`, payCol2, paymentY + 10);
    }
    
    // QR Code à droite du cadre
    try {
      const epcData = [
        'BCD', '002', '1', 'SCT', '',
        invoice.company.name.substring(0, 70),
        account.account_number.replace(/\s/g, ''),
        `EUR${invoice.total.toFixed(2)}`, '',
        invoice.structuredCommunication || invoice.saleNumber, '', ''
      ].join('\n');
      
      const qrCodeDataUrl = await QRCode.toDataURL(epcData, {
        width: 100,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      });
      
      const qrSize = 30;
      const qrX = pageWidth - 15 - qrSize;
      const qrY = yPos + 1;
      
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      
      // Label sous le QR code
      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Scannez pour payer', qrX + qrSize / 2, qrY + qrSize + 2, { align: 'center' });
    } catch (error) {
      console.error('Erreur génération QR code:', error);
    }
    
    doc.setTextColor(0, 0, 0);
    yPos += 40;
  }

  // ============ NOTES (exclure les notes génériques de paiement) ============
  if (invoice.notes) {
    // Filtrer les notes génériques comme "VIREMENT", "ESPECES", etc.
    const genericPaymentNotes = ['virement', 'espèces', 'especes', 'cb', 'carte', 'cash'];
    const cleanedNotes = invoice.notes.trim();
    const isGenericNote = genericPaymentNotes.some(
      note => cleanedNotes.toLowerCase() === note
    );
    
    if (!isGenericNote && cleanedNotes.length > 0) {
      const splitNotes = doc.splitTextToSize(cleanedNotes, pageWidth - 30);
      const notesHeight = splitNotes.length * 5 + 15;
      checkAndAddPage(notesHeight);
      yPos += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 80);
      doc.text('Notes:', 15, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(splitNotes, 15, yPos);
      yPos += splitNotes.length * 5 + 5;
      doc.setTextColor(0, 0, 0);
    }
  }

  // ============ FOOTER COMPACT ============
  const footerY = pageHeight - 35;
  
  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, footerY, pageWidth - 15, footerY);
  
  let footerTextY = footerY + 6;
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  
  // Ligne 1: Coordonnées
  doc.setFont('helvetica', 'normal');
  const footerLine1 = `${invoice.company.name} • ${invoice.company.address}, ${invoice.company.postalCode} ${invoice.company.city}`;
  doc.text(footerLine1, pageWidth / 2, footerTextY, { align: 'center' });
  footerTextY += 4;
  
  // Ligne 2: Contact et TVA
  let footerLine2 = `TVA: ${invoice.company.vatNumber}`;
  if (invoice.company.phone) footerLine2 += ` • Tél: ${invoice.company.phone}`;
  if (invoice.company.email) footerLine2 += ` • ${invoice.company.email}`;
  doc.text(footerLine2, pageWidth / 2, footerTextY, { align: 'center' });
  footerTextY += 4;
  
  // Ligne 3: Banque
  if (invoice.bankAccounts && invoice.bankAccounts.length > 0) {
    const footerLine3 = `${invoice.bankAccounts[0].bank_name}: ${invoice.bankAccounts[0].account_number}`;
    doc.text(footerLine3, pageWidth / 2, footerTextY, { align: 'center' });
    footerTextY += 4;
  }
  
  // Mention légale
  doc.setFontSize(5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(140, 140, 140);
  doc.text("Document à conserver 10 ans - Art. 315bis CIR92", pageWidth / 2, footerTextY + 2, { align: 'center' });

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