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
  const companyNameWithSRL = creditNote.company.name.toUpperCase().includes('SRL') 
    ? creditNote.company.name 
    : `${creditNote.company.name} SRL`;
  doc.text([
    companyNameWithSRL,
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
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(creditNote.customer.name || '', margin + 3, yPos + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let clientY = yPos + 9;
    if (creditNote.customer.address) {
      doc.text(`${creditNote.customer.address}${creditNote.customer.city ? `, ${creditNote.customer.postalCode || ''} ${creditNote.customer.city}` : ''}`, margin + 3, clientY);
      clientY += 4;
    }
    if (creditNote.customer.vatNumber) {
      doc.text(`TVA: ${creditNote.customer.vatNumber}`, margin + 3, clientY);
    }
    yPos += 22;
  } else {
    yPos += 5;
  }

  // ============ MOTIF (compact) ============
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 1, 1, 'F');
  
  doc.setFontSize(6);
  doc.setTextColor(150, 50, 50);
  doc.text('MOTIF:', margin + 3, yPos + 4);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const reasonText = doc.splitTextToSize(creditNote.reason || '', pageWidth - margin * 2 - 20);
  doc.text(reasonText[0] || '', margin + 18, yPos + 4);
  
  yPos += 14;

  // ============ TABLEAU DES ARTICLES (pleine largeur comme facture) ============
  const tableData = creditNote.items.map(item => [
    item.description || 'Article',
    item.quantity.toString(),
    `${(item.unitPrice || 0).toFixed(2)} €`,
    item.vatRate === 0 ? 'Exempté' : `${item.vatRate ?? 21}%`,
    `${(item.subtotal || 0).toFixed(2)} €`,
    `${(item.vatAmount || 0).toFixed(2)} €`,
    `${(item.total || 0).toFixed(2)} €`
  ]);

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
      0: { cellWidth: 'auto' },
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

  // ============ SECTION TOTAUX (style facture) ============
  const sectionStartY = yPos;
  
  // Dimensions
  const totalsWidth = 85;
  const totalsX = pageWidth - margin - totalsWidth;
  const rightEdge = pageWidth - margin;
  
  // Calculer le détail TVA par taux
  const vatByRate: { [key: number]: { ht: number; vat: number } } = {};
  creditNote.items.forEach(item => {
    const rate = item.vatRate ?? 21;
    if (!vatByRate[rate]) {
      vatByRate[rate] = { ht: 0, vat: 0 };
    }
    vatByRate[rate].ht += item.subtotal || 0;
    vatByRate[rate].vat += item.vatAmount || 0;
  });
  const presentRates = Object.keys(vatByRate).map(Number).sort((a, b) => a - b);
  
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
  doc.text(`${(creditNote.subtotal || 0).toFixed(2)} €`, htvaRight, totalsYPos, { align: 'right' });
  doc.text(`${(creditNote.totalVat || 0).toFixed(2)} €`, tvaRight, totalsYPos, { align: 'right' });
  doc.text(`${(creditNote.total || 0).toFixed(2)} €`, ttcRight, totalsYPos, { align: 'right' });
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
  
  // Bandeau AVOIR TTC (rouge pour note de crédit)
  const totalBoxHeight = 8;
  doc.setFillColor(180, 30, 30);
  doc.roundedRect(totalsX - 3, totalsYPos - 5, totalsWidth + 6, totalBoxHeight, 1.5, 1.5, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('AVOIR TTC', totalsX, totalsYPos);
  doc.setFontSize(10);
  doc.text(`-${(creditNote.total || 0).toFixed(2)} €`, rightEdge, totalsYPos, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
  const totalsEndY = totalsYPos + 5;
  
  yPos = totalsEndY + 5;

  // ============ CACHET VALIDÉ ============
  if (creditNote.validatedAt) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 150, 0);
    doc.text('VALIDÉE', margin + 30, sectionStartY + 15, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`le ${format(new Date(creditNote.validatedAt), 'dd/MM/yyyy', { locale: fr })}`, margin + 30, sectionStartY + 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  // ============ NOTES (compact) ============
  if (creditNote.notes) {
    const genericNotes = ['virement', 'espèces', 'especes', 'cb', 'carte', 'cash'];
    const notes = creditNote.notes.trim();
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
    creditNote.company.name,
    creditNote.company.address,
    `${creditNote.company.postalCode} ${creditNote.company.city}`,
    `TVA: ${creditNote.company.vatNumber}`
  ].filter(Boolean).join(' • ');
  
  doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });
  doc.setFontSize(4);
  doc.setFont('helvetica', 'italic');
  doc.text("Art. 315bis CIR92", pageWidth / 2, footerY + 3, { align: 'center' });

  return doc;
};

export const downloadCreditNotePDF = async (creditNote: CreditNoteData): Promise<void> => {
  const doc = await generateCreditNotePDF(creditNote);
  doc.save(`note-credit-${creditNote.creditNoteNumber}.pdf`);
};

export const previewCreditNotePDF = async (creditNote: CreditNoteData): Promise<void> => {
  const doc = await generateCreditNotePDF(creditNote);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
};

export const getCreditNotePDFBlob = async (creditNote: CreditNoteData): Promise<Blob> => {
  const doc = await generateCreditNotePDF(creditNote);
  return doc.output('blob');
};
