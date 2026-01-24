import { format } from 'date-fns';

interface CreditNoteExportData {
  credit_note_number: string;
  created_at: string;
  validated_at?: string;
  original_invoice_id?: string;
  reason: string;
  notes?: string;
  subtotal: number;
  total_vat: number;
  total: number;
  customers?: {
    name: string;
    vat_number?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    email?: string;
    phone?: string;
  };
  credit_note_items?: Array<{
    product_name: string;
    product_barcode?: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
    subtotal: number;
    vat_amount: number;
    total: number;
  }>;
}

interface CompanyInfo {
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  vatNumber?: string;
  phone?: string;
  email?: string;
  iban?: string;
  bic?: string;
  legalForm?: string;
  bceNumber?: string;
}

function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getVATCategoryCode(vatRate: number): string {
  if (vatRate === 0) return 'Z';
  return 'S';
}

function calculateVATBreakdown(items: any[]): { vatRate: number; taxableAmount: number; taxAmount: number }[] {
  const breakdown: { [key: number]: { taxableAmount: number; taxAmount: number } } = {};
  
  items?.forEach((item: any) => {
    // IMPORTANT: Ne pas utiliser || 21 car 0 est un taux valide (exempté)
    const parsedRate = parseFloat(item.vat_rate);
    const rate = isNaN(parsedRate) ? 21 : parsedRate;
    if (!breakdown[rate]) {
      breakdown[rate] = { taxableAmount: 0, taxAmount: 0 };
    }
    breakdown[rate].taxableAmount += parseFloat(item.subtotal) || 0;
    breakdown[rate].taxAmount += parseFloat(item.vat_amount) || 0;
  });
  
  return Object.entries(breakdown).map(([rate, amounts]) => ({
    vatRate: parseFloat(rate),
    taxableAmount: amounts.taxableAmount,
    taxAmount: amounts.taxAmount,
  }));
}

// Export XML standard pour note de crédit
export function exportCreditNoteToXML(creditNote: CreditNoteExportData, companyInfo?: CompanyInfo): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<NoteDeCredit>\n';
  
  if (companyInfo) {
    xml += '  <Entreprise>\n';
    xml += '    <Nom>' + escapeXML(companyInfo.name) + '</Nom>\n';
    if (companyInfo.vatNumber) xml += '    <NumeroTVA>' + escapeXML(companyInfo.vatNumber) + '</NumeroTVA>\n';
    if (companyInfo.address) xml += '    <Adresse>' + escapeXML(companyInfo.address) + '</Adresse>\n';
    if (companyInfo.postalCode && companyInfo.city) {
      xml += '    <CodePostal>' + escapeXML(companyInfo.postalCode) + '</CodePostal>\n';
      xml += '    <Ville>' + escapeXML(companyInfo.city) + '</Ville>\n';
    }
    xml += '  </Entreprise>\n';
  }
  
  xml += '  <Document>\n';
  xml += '    <Numero>' + escapeXML(creditNote.credit_note_number) + '</Numero>\n';
  xml += '    <Date>' + format(new Date(creditNote.created_at), "yyyy-MM-dd'T'HH:mm:ss") + '</Date>\n';
  if (creditNote.validated_at) {
    xml += '    <DateValidation>' + format(new Date(creditNote.validated_at), "yyyy-MM-dd'T'HH:mm:ss") + '</DateValidation>\n';
  }
  xml += '    <Motif>' + escapeXML(creditNote.reason) + '</Motif>\n';
  if (creditNote.notes) {
    xml += '    <Notes>' + escapeXML(creditNote.notes) + '</Notes>\n';
  }
  
  if (creditNote.customers) {
    xml += '    <Client>\n';
    xml += '      <Nom>' + escapeXML(creditNote.customers.name) + '</Nom>\n';
    if (creditNote.customers.vat_number) xml += '      <NumeroTVA>' + escapeXML(creditNote.customers.vat_number) + '</NumeroTVA>\n';
    if (creditNote.customers.address) xml += '      <Adresse>' + escapeXML(creditNote.customers.address) + '</Adresse>\n';
    xml += '    </Client>\n';
  }
  
  xml += '    <Montants>\n';
  xml += '      <SousTotal>' + creditNote.subtotal.toFixed(2) + '</SousTotal>\n';
  xml += '      <TVA>' + creditNote.total_vat.toFixed(2) + '</TVA>\n';
  xml += '      <Total>' + creditNote.total.toFixed(2) + '</Total>\n';
  xml += '    </Montants>\n';
  
  if (creditNote.credit_note_items?.length) {
    xml += '    <Articles>\n';
    creditNote.credit_note_items.forEach((item) => {
      xml += '      <Article>\n';
      xml += '        <Nom>' + escapeXML(item.product_name) + '</Nom>\n';
      if (item.product_barcode) xml += '        <CodeBarre>' + escapeXML(item.product_barcode) + '</CodeBarre>\n';
      xml += '        <Quantite>' + item.quantity + '</Quantite>\n';
      xml += '        <PrixUnitaire>' + item.unit_price.toFixed(2) + '</PrixUnitaire>\n';
      xml += '        <TauxTVA>' + item.vat_rate + '</TauxTVA>\n';
      xml += '        <Total>' + item.total.toFixed(2) + '</Total>\n';
      xml += '      </Article>\n';
    });
    xml += '    </Articles>\n';
  }
  
  xml += '  </Document>\n';
  xml += '</NoteDeCredit>';
  
  return xml;
}

// Export UBL Peppol BIS 3.0 pour note de crédit (InvoiceTypeCode 381)
export function exportCreditNoteToUBL(creditNote: CreditNoteExportData, companyInfo?: CompanyInfo): string {
  const creditNoteDate = format(new Date(creditNote.created_at), 'yyyy-MM-dd');
  const vatBreakdown = calculateVATBreakdown(creditNote.credit_note_items || []);
  
  let ubl = '<?xml version="1.0" encoding="UTF-8"?>\n';
  ubl += '<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"\n';
  ubl += '            xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"\n';
  ubl += '            xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">\n';
  
  // EN-TETES Peppol BIS Billing 3.0
  ubl += '  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n';
  ubl += '  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>\n';
  ubl += '  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>\n';
  
  // IDENTIFICATION DU DOCUMENT
  ubl += '  <cbc:ID>' + escapeXML(creditNote.credit_note_number) + '</cbc:ID>\n';
  ubl += '  <cbc:IssueDate>' + creditNoteDate + '</cbc:IssueDate>\n';
  ubl += '  <cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>\n';
  ubl += '  <cbc:Note>' + escapeXML(creditNote.reason) + '</cbc:Note>\n';
  ubl += '  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>\n';
  
  // REFERENCE ACHETEUR
  const buyerReference = creditNote.customers?.vat_number || creditNote.customers?.name || creditNote.credit_note_number;
  ubl += '  <cbc:BuyerReference>' + escapeXML(buyerReference) + '</cbc:BuyerReference>\n';
  
  // PERIODE
  ubl += '  <cac:InvoicePeriod>\n';
  ubl += '    <cbc:StartDate>' + creditNoteDate + '</cbc:StartDate>\n';
  ubl += '    <cbc:EndDate>' + creditNoteDate + '</cbc:EndDate>\n';
  ubl += '  </cac:InvoicePeriod>\n';
  
  // VENDEUR
  if (companyInfo) {
    ubl += '  <cac:AccountingSupplierParty>\n';
    ubl += '    <cac:Party>\n';
    
    const sellerVAT = companyInfo.vatNumber?.replace(/\s/g, '') || '';
    if (sellerVAT) {
      ubl += '      <cbc:EndpointID schemeID="0208">' + escapeXML(sellerVAT) + '</cbc:EndpointID>\n';
      ubl += '      <cac:PartyIdentification>\n';
      ubl += '        <cbc:ID schemeID="0208">' + escapeXML(sellerVAT) + '</cbc:ID>\n';
      ubl += '      </cac:PartyIdentification>\n';
    }
    
    ubl += '      <cac:PartyName>\n';
    ubl += '        <cbc:Name>' + escapeXML(companyInfo.name) + '</cbc:Name>\n';
    ubl += '      </cac:PartyName>\n';
    
    ubl += '      <cac:PostalAddress>\n';
    if (companyInfo.address) {
      ubl += '        <cbc:StreetName>' + escapeXML(companyInfo.address) + '</cbc:StreetName>\n';
    }
    ubl += '        <cbc:CityName>' + escapeXML(companyInfo.city || 'Non specifiee') + '</cbc:CityName>\n';
    ubl += '        <cbc:PostalZone>' + escapeXML(companyInfo.postalCode || '0000') + '</cbc:PostalZone>\n';
    ubl += '        <cac:Country>\n';
    ubl += '          <cbc:IdentificationCode>BE</cbc:IdentificationCode>\n';
    ubl += '        </cac:Country>\n';
    ubl += '      </cac:PostalAddress>\n';
    
    if (sellerVAT) {
      ubl += '      <cac:PartyTaxScheme>\n';
      ubl += '        <cbc:CompanyID>' + escapeXML(sellerVAT) + '</cbc:CompanyID>\n';
      ubl += '        <cac:TaxScheme>\n';
      ubl += '          <cbc:ID>VAT</cbc:ID>\n';
      ubl += '        </cac:TaxScheme>\n';
      ubl += '      </cac:PartyTaxScheme>\n';
    }
    
    ubl += '      <cac:PartyLegalEntity>\n';
    ubl += '        <cbc:RegistrationName>' + escapeXML(companyInfo.name) + '</cbc:RegistrationName>\n';
    if (companyInfo.bceNumber || sellerVAT) {
      ubl += '        <cbc:CompanyID schemeID="0208">' + escapeXML(companyInfo.bceNumber || sellerVAT) + '</cbc:CompanyID>\n';
    }
    ubl += '      </cac:PartyLegalEntity>\n';
    
    ubl += '    </cac:Party>\n';
    ubl += '  </cac:AccountingSupplierParty>\n';
  }
  
  // ACHETEUR
  ubl += '  <cac:AccountingCustomerParty>\n';
  ubl += '    <cac:Party>\n';
  
  if (creditNote.customers) {
    const customerVAT = creditNote.customers.vat_number?.replace(/\s/g, '') || '';
    
    if (customerVAT) {
      ubl += '      <cbc:EndpointID schemeID="0208">' + escapeXML(customerVAT) + '</cbc:EndpointID>\n';
    } else {
      ubl += '      <cbc:EndpointID schemeID="0002">' + escapeXML(creditNote.customers.name) + '</cbc:EndpointID>\n';
    }
    
    ubl += '      <cac:PartyName>\n';
    ubl += '        <cbc:Name>' + escapeXML(creditNote.customers.name) + '</cbc:Name>\n';
    ubl += '      </cac:PartyName>\n';
    
    ubl += '      <cac:PostalAddress>\n';
    if (creditNote.customers.address) {
      ubl += '        <cbc:StreetName>' + escapeXML(creditNote.customers.address) + '</cbc:StreetName>\n';
    }
    ubl += '        <cbc:CityName>' + escapeXML(creditNote.customers.city || 'Non specifiee') + '</cbc:CityName>\n';
    ubl += '        <cbc:PostalZone>' + escapeXML(creditNote.customers.postal_code || '0000') + '</cbc:PostalZone>\n';
    ubl += '        <cac:Country>\n';
    ubl += '          <cbc:IdentificationCode>BE</cbc:IdentificationCode>\n';
    ubl += '        </cac:Country>\n';
    ubl += '      </cac:PostalAddress>\n';
    
    if (customerVAT) {
      ubl += '      <cac:PartyTaxScheme>\n';
      ubl += '        <cbc:CompanyID>' + escapeXML(customerVAT) + '</cbc:CompanyID>\n';
      ubl += '        <cac:TaxScheme>\n';
      ubl += '          <cbc:ID>VAT</cbc:ID>\n';
      ubl += '        </cac:TaxScheme>\n';
      ubl += '      </cac:PartyTaxScheme>\n';
    }
    
    ubl += '      <cac:PartyLegalEntity>\n';
    ubl += '        <cbc:RegistrationName>' + escapeXML(creditNote.customers.name) + '</cbc:RegistrationName>\n';
    ubl += '      </cac:PartyLegalEntity>\n';
  } else {
    ubl += '      <cbc:EndpointID schemeID="0002">Client Anonyme</cbc:EndpointID>\n';
    ubl += '      <cac:PartyName>\n';
    ubl += '        <cbc:Name>Client Anonyme</cbc:Name>\n';
    ubl += '      </cac:PartyName>\n';
    ubl += '      <cac:PostalAddress>\n';
    ubl += '        <cbc:CityName>Non specifiee</cbc:CityName>\n';
    ubl += '        <cbc:PostalZone>0000</cbc:PostalZone>\n';
    ubl += '        <cac:Country>\n';
    ubl += '          <cbc:IdentificationCode>BE</cbc:IdentificationCode>\n';
    ubl += '        </cac:Country>\n';
    ubl += '      </cac:PostalAddress>\n';
    ubl += '      <cac:PartyLegalEntity>\n';
    ubl += '        <cbc:RegistrationName>Client Anonyme</cbc:RegistrationName>\n';
    ubl += '      </cac:PartyLegalEntity>\n';
  }
  
  ubl += '    </cac:Party>\n';
  ubl += '  </cac:AccountingCustomerParty>\n';
  
  // TVA GLOBALE
  ubl += '  <cac:TaxTotal>\n';
  ubl += '    <cbc:TaxAmount currencyID="EUR">' + creditNote.total_vat.toFixed(2) + '</cbc:TaxAmount>\n';
  
  vatBreakdown.forEach((vat) => {
    ubl += '    <cac:TaxSubtotal>\n';
    ubl += '      <cbc:TaxableAmount currencyID="EUR">' + vat.taxableAmount.toFixed(2) + '</cbc:TaxableAmount>\n';
    ubl += '      <cbc:TaxAmount currencyID="EUR">' + vat.taxAmount.toFixed(2) + '</cbc:TaxAmount>\n';
    ubl += '      <cac:TaxCategory>\n';
    ubl += '        <cbc:ID>' + getVATCategoryCode(vat.vatRate) + '</cbc:ID>\n';
    ubl += '        <cbc:Percent>' + vat.vatRate.toFixed(2) + '</cbc:Percent>\n';
    ubl += '        <cac:TaxScheme>\n';
    ubl += '          <cbc:ID>VAT</cbc:ID>\n';
    ubl += '        </cac:TaxScheme>\n';
    ubl += '      </cac:TaxCategory>\n';
    ubl += '    </cac:TaxSubtotal>\n';
  });
  
  ubl += '  </cac:TaxTotal>\n';
  
  // TOTAUX
  ubl += '  <cac:LegalMonetaryTotal>\n';
  ubl += '    <cbc:LineExtensionAmount currencyID="EUR">' + creditNote.subtotal.toFixed(2) + '</cbc:LineExtensionAmount>\n';
  ubl += '    <cbc:TaxExclusiveAmount currencyID="EUR">' + creditNote.subtotal.toFixed(2) + '</cbc:TaxExclusiveAmount>\n';
  ubl += '    <cbc:TaxInclusiveAmount currencyID="EUR">' + creditNote.total.toFixed(2) + '</cbc:TaxInclusiveAmount>\n';
  ubl += '    <cbc:PayableAmount currencyID="EUR">' + creditNote.total.toFixed(2) + '</cbc:PayableAmount>\n';
  ubl += '  </cac:LegalMonetaryTotal>\n';
  
  // LIGNES
  creditNote.credit_note_items?.forEach((item, index) => {
    const itemName = item.product_name || 'Article non désigné';
    // IMPORTANT: Ne pas utiliser || 21 car 0 est un taux valide (exempté)
    const parsedRate = parseFloat(String(item.vat_rate));
    const vatRate = isNaN(parsedRate) ? 21 : parsedRate;
    
    ubl += '  <cac:CreditNoteLine>\n';
    ubl += '    <cbc:ID>' + (index + 1) + '</cbc:ID>\n';
    ubl += '    <cbc:CreditedQuantity unitCode="EA">' + item.quantity + '</cbc:CreditedQuantity>\n';
    ubl += '    <cbc:LineExtensionAmount currencyID="EUR">' + item.subtotal.toFixed(2) + '</cbc:LineExtensionAmount>\n';
    
    ubl += '    <cac:Item>\n';
    ubl += '      <cbc:Name>' + escapeXML(itemName) + '</cbc:Name>\n';
    ubl += '      <cac:ClassifiedTaxCategory>\n';
    ubl += '        <cbc:ID>' + getVATCategoryCode(vatRate) + '</cbc:ID>\n';
    ubl += '        <cbc:Percent>' + vatRate.toFixed(2) + '</cbc:Percent>\n';
    ubl += '        <cac:TaxScheme>\n';
    ubl += '          <cbc:ID>VAT</cbc:ID>\n';
    ubl += '        </cac:TaxScheme>\n';
    ubl += '      </cac:ClassifiedTaxCategory>\n';
    ubl += '    </cac:Item>\n';
    
    ubl += '    <cac:Price>\n';
    ubl += '      <cbc:PriceAmount currencyID="EUR">' + item.unit_price.toFixed(2) + '</cbc:PriceAmount>\n';
    ubl += '    </cac:Price>\n';
    
    ubl += '  </cac:CreditNoteLine>\n';
  });
  
  ubl += '</CreditNote>';
  
  return ubl;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCreditNoteXML(creditNote: CreditNoteExportData, companyInfo?: CompanyInfo): void {
  const xml = exportCreditNoteToXML(creditNote, companyInfo);
  downloadFile(xml, `note-credit-${creditNote.credit_note_number}.xml`, 'application/xml');
}

export function downloadCreditNoteUBL(creditNote: CreditNoteExportData, companyInfo?: CompanyInfo): void {
  const ubl = exportCreditNoteToUBL(creditNote, companyInfo);
  downloadFile(ubl, `note-credit-${creditNote.credit_note_number}-ubl.xml`, 'application/xml');
}
