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
  doc.text([
    invoice.company.name,
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
    `${item.total.toFixed(2)} €`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'P.U.', 'TVA', 'Total']],
    body: tableData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fontStyle: 'bold',
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => { yPos = data.cursor?.y || yPos; }
  });

  yPos += 5;

  // ============ TOTAUX (compact, aligné à droite) ============
  const totalsWidth = 70;
  const totalsX = pageWidth - margin - totalsWidth;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('HT:', totalsX, yPos);
  doc.text(`${invoice.subtotal.toFixed(2)} €`, rightX, yPos, { align: 'right' });
  yPos += 4;
  
  doc.text('TVA:', totalsX, yPos);
  doc.text(`${invoice.totalVat.toFixed(2)} €`, rightX, yPos, { align: 'right' });
  yPos += 4;
  
  doc.setLineWidth(0.3);
  doc.line(totalsX, yPos, rightX, yPos);
  yPos += 4;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL TTC:', totalsX, yPos);
  doc.text(`${invoice.total.toFixed(2)} €`, rightX, yPos, { align: 'right' });
  yPos += 8;

  // ============ STATUT PAYÉ (compact) ============
  if (invoice.isPaid) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 0);
    doc.text('PAYÉ', pageWidth / 2, yPos + 5, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 12;
  }

  // ============ PAIEMENT + QR CODE (compact) ============
  if (!invoice.isPaid && invoice.bankAccounts && invoice.bankAccounts.length > 0) {
    const account = invoice.bankAccounts[0];
    const boxHeight = 25;
    
    doc.setDrawColor(0, 100, 180);
    doc.setLineWidth(0.5);
    doc.setFillColor(245, 250, 255);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2 - 35, boxHeight, 1, 1, 'FD');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 80, 150);
    doc.text('PAIEMENT', margin + 3, yPos + 5);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`${account.bank_name}: ${account.account_number}`, margin + 3, yPos + 10);
    
    const payInfo = invoice.structuredCommunication 
      ? `Communication: ${invoice.structuredCommunication}`
      : `Réf: ${invoice.saleNumber}`;
    doc.text(payInfo, margin + 3, yPos + 15);
    
    if (invoice.dueDate) {
      const daysDiff = differenceInDays(new Date(invoice.dueDate), new Date(invoice.date));
      doc.text(`Paiement à ${daysDiff} jours • Montant: ${invoice.total.toFixed(2)} €`, margin + 3, yPos + 20);
    }
    
    // QR Code compact
    try {
      const epcData = [
        'BCD', '002', '1', 'SCT', '',
        invoice.company.name.substring(0, 70),
        account.account_number.replace(/\s/g, ''),
        `EUR${invoice.total.toFixed(2)}`, '',
        invoice.structuredCommunication || invoice.saleNumber, '', ''
      ].join('\n');
      
      const qrCodeDataUrl = await QRCode.toDataURL(epcData, { width: 80, margin: 0 });
      doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - margin - 28, yPos, 25, 25);
    } catch { /* ignore */ }
    
    yPos += boxHeight + 5;
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