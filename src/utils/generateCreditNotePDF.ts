import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import logoInvoice from '../assets/logo-invoice.png';

interface CreditNoteData {
  creditNoteNumber: string;
  date: Date;
  validatedAt?: Date;
  originalInvoiceNumber?: string;
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
  reason: string;
  notes?: string;
  subtotal: number;
  totalVat: number;
  total: number;
}

export const generateCreditNotePDF = async (creditNote: CreditNoteData): Promise<jsPDF> => {
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
    doc.text(creditNote.company.name, margin, yPos + 8);
  }

  // Infos société (droite, compact)
  const rightX = pageWidth - margin;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text([
    creditNote.company.name,
    creditNote.company.address || '',
    `${creditNote.company.postalCode || ''} ${creditNote.company.city || ''}`.trim(),
    `TVA: ${creditNote.company.vatNumber || ''}`
  ].filter(Boolean), rightX, yPos + 2, { align: 'right' });

  yPos = 38;

  // ============ TITRE + INFOS NOTE DE CRÉDIT (même ligne) ============
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 30, 30);
  doc.text('NOTE DE CRÉDIT', margin, yPos);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const creditNoteInfo = [
    `N°: ${creditNote.creditNoteNumber}`,
    `Date: ${format(new Date(creditNote.date), 'dd/MM/yyyy', { locale: fr })}`,
    creditNote.originalInvoiceNumber ? `Réf: ${creditNote.originalInvoiceNumber}` : ''
  ].filter(Boolean).join('  •  ');
  doc.text(creditNoteInfo, rightX, yPos, { align: 'right' });

  yPos += 8;

  // ============ CLIENT (compact) ============
  if (creditNote.customer) {
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, yPos, 90, 18, 1, 1, 'F');
    
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text('DESTINATAIRE', margin + 3, yPos + 4);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(creditNote.customer.name || '', margin + 3, yPos + 9);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const addressParts = [
      creditNote.customer.address,
      `${creditNote.customer.postalCode || ''} ${creditNote.customer.city || ''}`.trim()
    ].filter(Boolean).join(', ');
    if (addressParts) {
      doc.text(addressParts, margin + 3, yPos + 13);
    }
    if (creditNote.customer.vatNumber) {
      doc.text(`TVA: ${creditNote.customer.vatNumber}`, margin + 3, yPos + 16);
    }
    yPos += 22;
  } else {
    yPos += 5;
  }

  // ============ MOTIF ============
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 14, 1, 1, 'F');
  
  doc.setFontSize(6);
  doc.setTextColor(150, 50, 50);
  doc.text('MOTIF DE L\'AVOIR', margin + 3, yPos + 4);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const reasonText = doc.splitTextToSize(creditNote.reason || '', pageWidth - margin * 2 - 10);
  doc.text(reasonText[0] || '', margin + 3, yPos + 10);
  
  yPos += 18;

  // ============ TABLEAU DES ARTICLES ============
  const tableData = creditNote.items.map(item => [
    item.description || 'Article',
    item.quantity.toString(),
    `${(item.unitPrice || 0).toFixed(2)} €`,
    item.vatRate === 0 ? 'Exempté' : `${item.vatRate ?? 21}%`,
    `${(item.total || 0).toFixed(2)} €`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'P.U. HT', 'TVA', 'Total TTC']],
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
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // ============ TOTAUX (compact, aligné à droite) ============
  const totalsWidth = 70;
  const totalsX = pageWidth - margin - totalsWidth;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sous-total HT:', totalsX, yPos);
  doc.text(`${(creditNote.subtotal || 0).toFixed(2)} €`, rightX, yPos, { align: 'right' });
  yPos += 5;
  
  doc.text('TVA:', totalsX, yPos);
  doc.text(`${(creditNote.totalVat || 0).toFixed(2)} €`, rightX, yPos, { align: 'right' });
  yPos += 5;
  
  doc.setLineWidth(0.3);
  doc.line(totalsX, yPos, rightX, yPos);
  yPos += 5;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 30, 30);
  doc.text('AVOIR TTC:', totalsX, yPos);
  doc.text(`-${(creditNote.total || 0).toFixed(2)} €`, rightX, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  yPos += 10;

  // ============ CACHET VALIDÉ ============
  if (creditNote.validatedAt) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 0);
    doc.text('VALIDÉE', pageWidth / 2, yPos + 3, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`le ${format(new Date(creditNote.validatedAt), 'dd/MM/yyyy', { locale: fr })}`, pageWidth / 2, yPos + 8, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 15;
  }

  // ============ NOTES ============
  if (creditNote.notes) {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    const splitNotes = doc.splitTextToSize(`Notes: ${creditNote.notes}`, pageWidth - margin * 2);
    doc.text(splitNotes, margin, yPos);
    doc.setTextColor(0, 0, 0);
  }

  // ============ FOOTER ============
  const footerY = pageHeight - 12;
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  
  const footerParts = [
    creditNote.company.name,
    creditNote.company.address,
    `${creditNote.company.postalCode} ${creditNote.company.city}`.trim(),
    `TVA: ${creditNote.company.vatNumber}`
  ].filter(Boolean);
  
  doc.text(footerParts.join(' • '), pageWidth / 2, footerY, { align: 'center' });
  
  if (creditNote.company.phone || creditNote.company.email) {
    const contactParts = [creditNote.company.phone, creditNote.company.email].filter(Boolean);
    doc.text(contactParts.join(' • '), pageWidth / 2, footerY + 4, { align: 'center' });
  }

  return doc;
};

export const downloadCreditNotePDF = async (creditNote: CreditNoteData): Promise<void> => {
  const doc = await generateCreditNotePDF(creditNote);
  doc.save(`note-credit-${creditNote.creditNoteNumber}.pdf`);
};

export const previewCreditNotePDF = async (creditNote: CreditNoteData): Promise<void> => {
  const doc = await generateCreditNotePDF(creditNote);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

export const getCreditNotePDFBlob = async (creditNote: CreditNoteData): Promise<Blob> => {
  const doc = await generateCreditNotePDF(creditNote);
  return doc.output('blob');
};
