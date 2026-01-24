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
  const margin = 12;
  let yPos = 12;

  // ============ HEADER: LOGO + SOCIÉTÉ ============
  try {
    doc.addImage(logoInvoice, 'PNG', margin, yPos, 40, 20);
  } catch {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.company.name, margin, yPos + 8);
  }

  // Infos société (droite, compact)
  const rightX = pageWidth - margin;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const companyNameWithSRL = invoice.company.name.toUpperCase().includes('SRL') 
    ? invoice.company.name 
    : `${invoice.company.name} SRL`;
  doc.text([
    companyNameWithSRL,
    invoice.company.address,
    `${invoice.company.postalCode} ${invoice.company.city}`,
    `TVA: ${invoice.company.vatNumber}`
  ], rightX, yPos + 2, { align: 'right' });

  yPos = 38;

  // ============ TITRE + INFOS FACTURE (même ligne) ============
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', margin, yPos);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const invoiceInfo = [
    `N°: ${invoice.saleNumber}`,
    `Date: ${format(new Date(invoice.date), 'dd/MM/yyyy', { locale: fr })}`,
    invoice.dueDate ? `Échéance: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}` : ''
  ].filter(Boolean).join('  •  ');
  doc.text(invoiceInfo, rightX, yPos, { align: 'right' });

  yPos += 8;

  // ============ CLIENT (compact) ============
  if (invoice.customer) {
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, yPos, 90, 18, 1, 1, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customer.name, margin + 3, yPos + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let clientY = yPos + 9;
    if (invoice.customer.address) {
      doc.text(`${invoice.customer.address}${invoice.customer.city ? `, ${invoice.customer.postalCode || ''} ${invoice.customer.city}` : ''}`, margin + 3, clientY);
      clientY += 4;
    }
    if (invoice.customer.vatNumber) {
      doc.text(`TVA: ${invoice.customer.vatNumber}`, margin + 3, clientY);
    }
    yPos += 22;
  } else {
    yPos += 5;
  }

  // ============ TABLEAU DES ARTICLES (compact) ============
  const tableData = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${item.unitPrice.toFixed(2)} €`,
    `${item.vatRate}%`,
    `${item.subtotal.toFixed(2)} €`,
    `${item.vatAmount.toFixed(2)} €`,
    `${item.total.toFixed(2)} €`
  ]);

  // Tableau pleine largeur avec marges réduites
  const tableMargin = 5;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'P.U. HT', 'TVA %', 'Total HT', 'Montant TVA', 'Total TTC']],
    body: tableData,
    theme: 'plain',
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: {
      fontStyle: 'bold',
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Description prend l'espace restant
      1: { cellWidth: 12, halign: 'left' },
      2: { cellWidth: 22, halign: 'left' },
      3: { cellWidth: 14, halign: 'left' },
      4: { cellWidth: 24, halign: 'left' },
      5: { cellWidth: 24, halign: 'left' },
      6: { cellWidth: 24, halign: 'left', fontStyle: 'bold' },
    },
    margin: { left: tableMargin, right: tableMargin },
    didDrawPage: (data) => { yPos = data.cursor?.y || yPos; }
  });

  yPos += 8;

  // ============ SECTION PAIEMENT (gauche) + TOTAUX (droite) ============
  const sectionStartY = yPos;
  
  // Dimensions
  const totalsWidth = 85;
  const totalsX = pageWidth - margin - totalsWidth;
  const rightEdge = pageWidth - margin;
  const paymentBoxWidth = totalsX - margin - 8; // Espace de 8mm entre paiement et totaux
  
  // Calculer le détail TVA par taux
  const vatByRate: { [key: number]: { ht: number; vat: number } } = {};
  invoice.items.forEach(item => {
    if (!vatByRate[item.vatRate]) {
      vatByRate[item.vatRate] = { ht: 0, vat: 0 };
    }
    vatByRate[item.vatRate].ht += item.subtotal;
    vatByRate[item.vatRate].vat += item.vatAmount;
  });
  const presentRates = [0, 6, 12, 21].filter(rate => vatByRate[rate]);
  
  // ============ PAIEMENT À GAUCHE (avec QR code intégré) ============
  let paymentEndY = sectionStartY;
  if (!invoice.isPaid && invoice.bankAccounts && invoice.bankAccounts.length > 0) {
    const account = invoice.bankAccounts[0];
    const qrSize = 22;
    const boxHeight = qrSize + 4; // Hauteur adaptée au QR code
    
    doc.setDrawColor(0, 100, 180);
    doc.setLineWidth(0.5);
    doc.setFillColor(245, 250, 255);
    doc.roundedRect(margin, sectionStartY, paymentBoxWidth, boxHeight, 1, 1, 'FD');
    
    // QR Code à droite dans la box
    try {
      const epcData = [
        'BCD', '002', '1', 'SCT', '',
        invoice.company.name.substring(0, 70),
        account.account_number.replace(/\s/g, ''),
        `EUR${invoice.total.toFixed(2)}`, '',
        invoice.structuredCommunication || invoice.saleNumber, '', ''
      ].join('\n');
      
      const qrCodeDataUrl = await QRCode.toDataURL(epcData, { width: 80, margin: 0 });
      const qrX = margin + paymentBoxWidth - qrSize - 2;
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, sectionStartY + 2, qrSize, qrSize);
    } catch { /* ignore */ }
    
    // Texte à gauche du QR
    const textMaxWidth = paymentBoxWidth - qrSize - 8;
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 80, 150);
    doc.text('PAIEMENT', margin + 3, sectionStartY + 5);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`${account.bank_name}: ${account.account_number}`, margin + 3, sectionStartY + 10);
    
    const payInfo = invoice.structuredCommunication 
      ? `Communication: ${invoice.structuredCommunication}`
      : `Réf: ${invoice.saleNumber}`;
    doc.text(payInfo, margin + 3, sectionStartY + 15);
    
    if (invoice.dueDate) {
      const daysDiff = differenceInDays(new Date(invoice.dueDate), new Date(invoice.date));
      doc.text(`Paiement à ${daysDiff} jours • Montant: ${invoice.total.toFixed(2)} €`, margin + 3, sectionStartY + 20);
    }
    
    paymentEndY = sectionStartY + boxHeight + 3;
  }
  
  // ============ TOTAUX À DROITE ============
  let totalsYPos = sectionStartY;
  
  // Colonnes pour les 3 valeurs
  const colWidth = 28;
  const ttcRight = rightEdge;
  const tvaRight = rightEdge - colWidth;
  const htvaRight = rightEdge - (2 * colWidth);
  
  // En-têtes des colonnes
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('HTVA', htvaRight, totalsYPos, { align: 'right' });
  doc.text('TVA', tvaRight, totalsYPos, { align: 'right' });
  doc.text('TTC', ttcRight, totalsYPos, { align: 'right' });
  totalsYPos += 5;
  
  // Ligne Total HTVA avec les 3 colonnes
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Total', totalsX, totalsYPos);
  doc.text(`${invoice.subtotal.toFixed(2)} €`, htvaRight, totalsYPos, { align: 'right' });
  doc.text(`${invoice.totalVat.toFixed(2)} €`, tvaRight, totalsYPos, { align: 'right' });
  doc.text(`${invoice.total.toFixed(2)} €`, ttcRight, totalsYPos, { align: 'right' });
  totalsYPos += 4;
  
  // Détail TVA par taux
  presentRates.forEach(rate => {
    const data = vatByRate[rate];
    const ttc = data.ht + data.vat;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    const rateLabel = rate === 0 ? 'Exempté' : `${rate}%`;
    doc.text(rateLabel, totalsX, totalsYPos);
    doc.text(`${data.ht.toFixed(2)} €`, htvaRight, totalsYPos, { align: 'right' });
    doc.text(`${data.vat.toFixed(2)} €`, tvaRight, totalsYPos, { align: 'right' });
    doc.text(`${ttc.toFixed(2)} €`, ttcRight, totalsYPos, { align: 'right' });
    totalsYPos += 3.5;
  });
  
  totalsYPos += 2;
  
  // Ligne de séparation fine
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(totalsX, totalsYPos, rightEdge, totalsYPos);
  totalsYPos += 5;
  
  // Bandeau TOTAL TVAC
  const totalBoxHeight = 8;
  doc.setFillColor(0, 90, 160);
  doc.roundedRect(totalsX - 3, totalsYPos - 5, totalsWidth + 6, totalBoxHeight, 1.5, 1.5, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL TVAC', totalsX, totalsYPos);
  doc.setFontSize(10);
  doc.text(`${invoice.total.toFixed(2)} €`, rightEdge, totalsYPos, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
  const totalsEndY = totalsYPos + 5;
  
  yPos = Math.max(paymentEndY, totalsEndY) + 5;
  
  // ============ STATUT PAYÉ ============
  if (invoice.isPaid) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 0);
    doc.text('PAYÉ', margin + 30, sectionStartY + 15, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos = Math.max(yPos, totalsEndY + 8);
  }

  // ============ NOTES (compact) ============
  if (invoice.notes) {
    const genericNotes = ['virement', 'espèces', 'especes', 'cb', 'carte', 'cash'];
    const notes = invoice.notes.trim();
    if (!genericNotes.some(n => notes.toLowerCase() === n) && notes.length > 0) {
      doc.setFontSize(6);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const splitNotes = doc.splitTextToSize(`Notes: ${notes}`, pageWidth - margin * 2);
      doc.text(splitNotes, margin, yPos);
      yPos += splitNotes.length * 3 + 3;
      doc.setTextColor(0, 0, 0);
    }
  }

  // ============ FOOTER MINIMALISTE ============
  const footerY = pageHeight - 12;
  doc.setFontSize(5);
  doc.setTextColor(130, 130, 130);
  doc.setFont('helvetica', 'normal');
  
  const footerText = [
    invoice.company.name,
    invoice.company.address,
    `${invoice.company.postalCode} ${invoice.company.city}`,
    `TVA: ${invoice.company.vatNumber}`,
    invoice.bankAccounts?.[0] ? `IBAN: ${invoice.bankAccounts[0].account_number}` : ''
  ].filter(Boolean).join(' • ');
  
  doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });
  doc.setFontSize(4);
  doc.setFont('helvetica', 'italic');
  doc.text("Art. 315bis CIR92", pageWidth / 2, footerY + 3, { align: 'center' });

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