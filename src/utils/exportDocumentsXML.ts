import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExportOptions {
  documents: any[];
  type: 'sales' | 'invoices';
  dateRange?: { start: Date; end: Date };
  companyInfo?: {
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
  };
}

// Helper pour obtenir le code TVA Peppol
function getVATCategoryCode(vatRate: number): string {
  if (vatRate === 0) return 'Z';
  return 'S';
}

// Helper pour formater le numéro d'entreprise belge pour Peppol
// Format attendu: 10 chiffres sans "BE" (ex: "0808695829")
function formatBelgianEnterpriseNumber(vatOrBce: string | undefined): string {
  if (!vatOrBce) return '';
  // Supprimer espaces, points, tirets
  let cleaned = vatOrBce.replace(/[\s.\-]/g, '').toUpperCase();
  // Supprimer le préfixe BE s'il existe
  if (cleaned.startsWith('BE')) {
    cleaned = cleaned.substring(2);
  }
  // S'assurer qu'on a 10 chiffres (ajouter 0 devant si 9 chiffres)
  if (cleaned.length === 9 && /^\d+$/.test(cleaned)) {
    cleaned = '0' + cleaned;
  }
  // Valider que c'est bien 10 chiffres
  if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
    return cleaned;
  }
  return cleaned; // Retourner tel quel si format non reconnu
}

// Helper pour calculer la ventilation TVA par taux
// IMPORTANT: Recalcule le montant TVA pour garantir la cohérence Peppol BR-CO-17
function calculateVATBreakdown(items: any[]): { vatRate: number; taxableAmount: number; taxAmount: number }[] {
  const breakdown: { [key: number]: { taxableAmount: number } } = {};
  
  items?.forEach((item: any) => {
    // IMPORTANT: Ne pas utiliser || 21 car 0 est un taux valide (exempté)
    const parsedRate = parseFloat(item.vat_rate);
    const rate = isNaN(parsedRate) ? 21 : parsedRate;
    if (!breakdown[rate]) {
      breakdown[rate] = { taxableAmount: 0 };
    }
    breakdown[rate].taxableAmount += parseFloat(item.subtotal) || 0;
  });
  
  // Recalculer le montant TVA à partir du montant taxable et du taux
  // Ceci garantit BR-CO-17: VAT amount = taxable amount × (rate / 100)
  return Object.entries(breakdown).map(([rate, amounts]) => {
    const vatRate = parseFloat(rate);
    const taxableAmount = Math.round(amounts.taxableAmount * 100) / 100;
    const taxAmount = Math.round(taxableAmount * vatRate) / 100;
    return {
      vatRate,
      taxableAmount,
      taxAmount,
    };
  });
}

// Export XML standard
export function exportToXML(options: ExportOptions): void {
  const { documents, type, dateRange, companyInfo } = options;
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<' + (type === 'sales' ? 'Ventes' : 'Factures') + '>\n';
  
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
  
  if (dateRange) {
    xml += '  <Periode>\n';
    xml += '    <Debut>' + format(dateRange.start, 'yyyy-MM-dd') + '</Debut>\n';
    xml += '    <Fin>' + format(dateRange.end, 'yyyy-MM-dd') + '</Fin>\n';
    xml += '  </Periode>\n';
  }
  
  xml += '  <Documents>\n';
  
  documents.forEach(doc => {
    xml += '    <Document>\n';
    xml += '      <Numero>' + escapeXML(doc.sale_number || doc.invoice_number) + '</Numero>\n';
    xml += '      <Date>' + format(new Date(doc.date || doc.created_at), "yyyy-MM-dd'T'HH:mm:ss") + '</Date>\n';
    
    if (doc.fiscal_number) {
      xml += '      <NumeroFiscal>' + escapeXML(doc.fiscal_number) + '</NumeroFiscal>\n';
    }
    
    if (doc.customers) {
      xml += '      <Client>\n';
      xml += '        <Nom>' + escapeXML(doc.customers.name) + '</Nom>\n';
      if (doc.customers.vat_number) xml += '        <NumeroTVA>' + escapeXML(doc.customers.vat_number) + '</NumeroTVA>\n';
      xml += '      </Client>\n';
    }
    
    xml += '      <Montants>\n';
    xml += '        <SousTotal>' + doc.subtotal.toFixed(2) + '</SousTotal>\n';
    xml += '        <TVA>' + doc.total_vat.toFixed(2) + '</TVA>\n';
    xml += '        <Total>' + doc.total.toFixed(2) + '</Total>\n';
    xml += '      </Montants>\n';
    
    if (doc.payment_method) {
      xml += '      <ModePaiement>' + escapeXML(doc.payment_method) + '</ModePaiement>\n';
    }
    
    xml += '      <Statut>' + (doc.is_cancelled ? 'ANNULE' : 'VALIDE') + '</Statut>\n';
    
    if (doc.sale_items?.length > 0) {
      xml += '      <Articles>\n';
      doc.sale_items.forEach((item: any) => {
        xml += '        <Article>\n';
        xml += '          <Nom>' + escapeXML(item.product_name) + '</Nom>\n';
        xml += '          <Quantite>' + item.quantity + '</Quantite>\n';
        xml += '          <PrixUnitaire>' + item.unit_price.toFixed(2) + '</PrixUnitaire>\n';
        xml += '          <TauxTVA>' + item.vat_rate + '</TauxTVA>\n';
        xml += '          <Total>' + item.total.toFixed(2) + '</Total>\n';
        xml += '        </Article>\n';
      });
      xml += '      </Articles>\n';
    }
    
    xml += '    </Document>\n';
  });
  
  xml += '  </Documents>\n';
  
  xml += '  <Resume>\n';
  const validDocs = documents.filter(d => !d.is_cancelled);
  const totalAmount = validDocs.reduce((sum, d) => sum + d.total, 0);
  xml += '    <NombreDocuments>' + validDocs.length + '</NombreDocuments>\n';
  xml += '    <MontantTotal>' + totalAmount.toFixed(2) + '</MontantTotal>\n';
  xml += '  </Resume>\n';
  
  xml += '</' + (type === 'sales' ? 'Ventes' : 'Factures') + '>';
  
  downloadFile(xml, type + '_' + format(new Date(), 'yyyy-MM-dd_HHmm') + '.xml', 'application/xml');
}

// Génère le contenu UBL conforme Peppol BIS Billing 3.0 (EN16931)
function generateUBLContent(doc: any, companyInfo?: ExportOptions['companyInfo']): string {
  const invoiceDate = format(new Date(doc.date), 'yyyy-MM-dd');
  const dueDate = doc.due_date 
    ? format(new Date(doc.due_date), 'yyyy-MM-dd') 
    : format(new Date(doc.date), 'yyyy-MM-dd');
  
  const vatBreakdown = calculateVATBreakdown(doc.sale_items);
  
  let ubl = '<?xml version="1.0" encoding="UTF-8"?>\n';
  ubl += '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"\n';
  ubl += '         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"\n';
  ubl += '         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">\n';
  
  // EN-TETES Peppol BIS Billing 3.0 (standard européen recommandé)
  ubl += '  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n';
  ubl += '  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>\n';
  ubl += '  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>\n';
  
  // IDENTIFICATION DU DOCUMENT
  ubl += '  <cbc:ID>' + escapeXML(doc.sale_number) + '</cbc:ID>\n';
  ubl += '  <cbc:IssueDate>' + invoiceDate + '</cbc:IssueDate>\n';
  ubl += '  <cbc:DueDate>' + dueDate + '</cbc:DueDate>\n';
  ubl += '  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>\n';
  ubl += '  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>\n';
  
  // REFERENCE ACHETEUR
  const buyerReference = doc.customers?.vat_number || doc.customers?.name || doc.sale_number;
  ubl += '  <cbc:BuyerReference>' + escapeXML(buyerReference) + '</cbc:BuyerReference>\n';
  
  // PERIODE DE FACTURATION
  ubl += '  <cac:InvoicePeriod>\n';
  ubl += '    <cbc:StartDate>' + invoiceDate + '</cbc:StartDate>\n';
  ubl += '    <cbc:EndDate>' + invoiceDate + '</cbc:EndDate>\n';
  ubl += '  </cac:InvoicePeriod>\n';
  
  // NOTE: AdditionalDocumentReference supprimées car elles causent des conflits de validation
  // entre les règles UBL génériques (ubl-CR-114) et UBL.BE (ubl-BE-02/04)
  // Ces références sont optionnelles selon Peppol BIS Billing 3.0
  
  // VENDEUR (BG-4)
  if (companyInfo) {
    ubl += '  <cac:AccountingSupplierParty>\n';
    ubl += '    <cac:Party>\n';
    
    // Format numéro entreprise belge: 10 chiffres sans "BE"
    const sellerEnterpriseNumber = formatBelgianEnterpriseNumber(companyInfo.bceNumber || companyInfo.vatNumber);
    const sellerVAT = companyInfo.vatNumber?.replace(/[\s.\-]/g, '').toUpperCase() || '';
    
    if (sellerEnterpriseNumber) {
      ubl += '      <cbc:EndpointID schemeID="0208">' + escapeXML(sellerEnterpriseNumber) + '</cbc:EndpointID>\n';
      ubl += '      <cac:PartyIdentification>\n';
      ubl += '        <cbc:ID schemeID="0208">' + escapeXML(sellerEnterpriseNumber) + '</cbc:ID>\n';
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
    if (sellerEnterpriseNumber) {
      ubl += '        <cbc:CompanyID schemeID="0208">' + escapeXML(sellerEnterpriseNumber) + '</cbc:CompanyID>\n';
    }
    if (companyInfo.legalForm) {
      ubl += '        <cbc:CompanyLegalForm>' + escapeXML(companyInfo.legalForm) + '</cbc:CompanyLegalForm>\n';
    }
    ubl += '      </cac:PartyLegalEntity>\n';
    
    if (companyInfo.phone || companyInfo.email) {
      ubl += '      <cac:Contact>\n';
      ubl += '        <cbc:Name>' + escapeXML(companyInfo.name) + '</cbc:Name>\n';
      if (companyInfo.phone) {
        ubl += '        <cbc:Telephone>' + escapeXML(companyInfo.phone) + '</cbc:Telephone>\n';
      }
      if (companyInfo.email) {
        ubl += '        <cbc:ElectronicMail>' + escapeXML(companyInfo.email) + '</cbc:ElectronicMail>\n';
      }
      ubl += '      </cac:Contact>\n';
    }
    
    ubl += '    </cac:Party>\n';
    ubl += '  </cac:AccountingSupplierParty>\n';
  }
  
  // ACHETEUR (BG-7)
  ubl += '  <cac:AccountingCustomerParty>\n';
  ubl += '    <cac:Party>\n';
  
  if (doc.customers) {
    // Format numéro entreprise belge: 10 chiffres sans "BE"
    const customerEnterpriseNumber = formatBelgianEnterpriseNumber(doc.customers.vat_number);
    const customerVAT = doc.customers.vat_number?.replace(/[\s.\-]/g, '').toUpperCase() || '';
    
    if (customerEnterpriseNumber) {
      ubl += '      <cbc:EndpointID schemeID="0208">' + escapeXML(customerEnterpriseNumber) + '</cbc:EndpointID>\n';
      ubl += '      <cac:PartyIdentification>\n';
      ubl += '        <cbc:ID schemeID="0208">' + escapeXML(customerEnterpriseNumber) + '</cbc:ID>\n';
      ubl += '      </cac:PartyIdentification>\n';
    } else {
      ubl += '      <cbc:EndpointID schemeID="0002">' + escapeXML(doc.customers.name) + '</cbc:EndpointID>\n';
    }
    
    ubl += '      <cac:PartyName>\n';
    ubl += '        <cbc:Name>' + escapeXML(doc.customers.name) + '</cbc:Name>\n';
    ubl += '      </cac:PartyName>\n';
    
    ubl += '      <cac:PostalAddress>\n';
    if (doc.customers.address) {
      ubl += '        <cbc:StreetName>' + escapeXML(doc.customers.address) + '</cbc:StreetName>\n';
    }
    ubl += '        <cbc:CityName>' + escapeXML(doc.customers.city || 'Non specifiee') + '</cbc:CityName>\n';
    ubl += '        <cbc:PostalZone>' + escapeXML(doc.customers.postal_code || '0000') + '</cbc:PostalZone>\n';
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
    ubl += '        <cbc:RegistrationName>' + escapeXML(doc.customers.name) + '</cbc:RegistrationName>\n';
    if (customerEnterpriseNumber) {
      ubl += '        <cbc:CompanyID schemeID="0208">' + escapeXML(customerEnterpriseNumber) + '</cbc:CompanyID>\n';
    }
    ubl += '      </cac:PartyLegalEntity>\n';
    
    if (doc.customers.email || doc.customers.phone) {
      ubl += '      <cac:Contact>\n';
      ubl += '        <cbc:Name>' + escapeXML(doc.customers.name) + '</cbc:Name>\n';
      if (doc.customers.phone) {
        ubl += '        <cbc:Telephone>' + escapeXML(doc.customers.phone) + '</cbc:Telephone>\n';
      }
      if (doc.customers.email) {
        ubl += '        <cbc:ElectronicMail>' + escapeXML(doc.customers.email) + '</cbc:ElectronicMail>\n';
      }
      ubl += '      </cac:Contact>\n';
    }
  } else {
    ubl += '      <cbc:EndpointID schemeID="0002">ANONYMOUS</cbc:EndpointID>\n';
    ubl += '      <cac:PartyName>\n';
    ubl += '        <cbc:Name>Client anonyme</cbc:Name>\n';
    ubl += '      </cac:PartyName>\n';
    ubl += '      <cac:PostalAddress>\n';
    ubl += '        <cbc:CityName>Non specifiee</cbc:CityName>\n';
    ubl += '        <cbc:PostalZone>0000</cbc:PostalZone>\n';
    ubl += '        <cac:Country>\n';
    ubl += '          <cbc:IdentificationCode>BE</cbc:IdentificationCode>\n';
    ubl += '        </cac:Country>\n';
    ubl += '      </cac:PostalAddress>\n';
    ubl += '      <cac:PartyLegalEntity>\n';
    ubl += '        <cbc:RegistrationName>Client anonyme</cbc:RegistrationName>\n';
    ubl += '      </cac:PartyLegalEntity>\n';
  }
  
  ubl += '    </cac:Party>\n';
  ubl += '  </cac:AccountingCustomerParty>\n';
  
  // INSTRUCTIONS DE PAIEMENT (BG-16)
  ubl += '  <cac:PaymentMeans>\n';
  
  let paymentMeansCode = '30';
  const paymentMethod = doc.payment_method?.toLowerCase() || '';
  if (paymentMethod === 'cash') paymentMeansCode = '10';
  else if (paymentMethod === 'card') paymentMeansCode = '48';
  else if (paymentMethod === 'check') paymentMeansCode = '20';
  
  ubl += '    <cbc:PaymentMeansCode>' + paymentMeansCode + '</cbc:PaymentMeansCode>\n';
  
  if (companyInfo?.iban) {
    ubl += '    <cac:PayeeFinancialAccount>\n';
    ubl += '      <cbc:ID>' + escapeXML(companyInfo.iban.replace(/\s/g, '')) + '</cbc:ID>\n';
    ubl += '      <cbc:Name>' + escapeXML(companyInfo.name) + '</cbc:Name>\n';
    if (companyInfo.bic) {
      ubl += '      <cac:FinancialInstitutionBranch>\n';
      ubl += '        <cbc:ID>' + escapeXML(companyInfo.bic.replace(/\s/g, '')) + '</cbc:ID>\n';
      ubl += '      </cac:FinancialInstitutionBranch>\n';
    }
    ubl += '    </cac:PayeeFinancialAccount>\n';
  }
  
  ubl += '  </cac:PaymentMeans>\n';
  
  // CONDITIONS DE PAIEMENT (BT-20)
  ubl += '  <cac:PaymentTerms>\n';
  ubl += '    <cbc:Note>Paiement a reception de facture</cbc:Note>\n';
  ubl += '  </cac:PaymentTerms>\n';
  
  // VENTILATION TVA (BG-23) - Peppol BIS Billing 3.0 (sans Name)
  // BR-CO-14: TaxTotal/TaxAmount DOIT être égal à la somme des TaxSubtotal/TaxAmount
  const calculatedTotalVat = vatBreakdown.reduce((sum, vat) => sum + vat.taxAmount, 0);
  const totalVatAmount = vatBreakdown.length > 0 ? calculatedTotalVat : (doc.total_vat || 0);
  
  ubl += '  <cac:TaxTotal>\n';
  ubl += '    <cbc:TaxAmount currencyID="EUR">' + totalVatAmount.toFixed(2) + '</cbc:TaxAmount>\n';
  
  if (vatBreakdown.length > 0) {
    vatBreakdown.forEach(function(vat) {
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
  } else {
    ubl += '    <cac:TaxSubtotal>\n';
    ubl += '      <cbc:TaxableAmount currencyID="EUR">' + (doc.subtotal || 0).toFixed(2) + '</cbc:TaxableAmount>\n';
    ubl += '      <cbc:TaxAmount currencyID="EUR">' + (doc.total_vat || 0).toFixed(2) + '</cbc:TaxAmount>\n';
    ubl += '      <cac:TaxCategory>\n';
    ubl += '        <cbc:ID>S</cbc:ID>\n';
    ubl += '        <cbc:Percent>21.00</cbc:Percent>\n';
    ubl += '        <cac:TaxScheme>\n';
    ubl += '          <cbc:ID>VAT</cbc:ID>\n';
    ubl += '        </cac:TaxScheme>\n';
    ubl += '      </cac:TaxCategory>\n';
    ubl += '    </cac:TaxSubtotal>\n';
  }
  
  ubl += '  </cac:TaxTotal>\n';
  
  // TOTAUX MONETAIRES (BG-22)
  // BR-CO-15: TaxInclusiveAmount = TaxExclusiveAmount + TaxAmount
  const taxExclusiveAmount = doc.subtotal || 0;
  const calculatedTaxInclusiveAmount = taxExclusiveAmount + totalVatAmount;
  
  ubl += '  <cac:LegalMonetaryTotal>\n';
  ubl += '    <cbc:LineExtensionAmount currencyID="EUR">' + taxExclusiveAmount.toFixed(2) + '</cbc:LineExtensionAmount>\n';
  ubl += '    <cbc:TaxExclusiveAmount currencyID="EUR">' + taxExclusiveAmount.toFixed(2) + '</cbc:TaxExclusiveAmount>\n';
  ubl += '    <cbc:TaxInclusiveAmount currencyID="EUR">' + calculatedTaxInclusiveAmount.toFixed(2) + '</cbc:TaxInclusiveAmount>\n';
  if (doc.total_discount && doc.total_discount > 0) {
    ubl += '    <cbc:AllowanceTotalAmount currencyID="EUR">' + doc.total_discount.toFixed(2) + '</cbc:AllowanceTotalAmount>\n';
  }
  ubl += '    <cbc:PayableAmount currencyID="EUR">' + calculatedTaxInclusiveAmount.toFixed(2) + '</cbc:PayableAmount>\n';
  ubl += '  </cac:LegalMonetaryTotal>\n';
  
  // LIGNES DE FACTURE (BG-25) avec TaxTotal par ligne (ubl-BE-14)
  if (doc.sale_items?.length > 0) {
    doc.sale_items.forEach(function(item: any, idx: number) {
      // IMPORTANT: Ne pas utiliser || 21 car 0 est un taux valide (exempté)
      const parsedItemRate = parseFloat(item.vat_rate);
      const itemVatRate = isNaN(parsedItemRate) ? 21 : parsedItemRate;
      const itemVatAmount = parseFloat(item.vat_amount) || 0;
      const productName = item.product_name?.trim() || 'Article non designe';
      
      ubl += '  <cac:InvoiceLine>\n';
      ubl += '    <cbc:ID>' + (idx + 1) + '</cbc:ID>\n';
      ubl += '    <cbc:InvoicedQuantity unitCode="C62">' + parseFloat(item.quantity).toFixed(3) + '</cbc:InvoicedQuantity>\n';
      ubl += '    <cbc:LineExtensionAmount currencyID="EUR">' + (parseFloat(item.subtotal) || 0).toFixed(2) + '</cbc:LineExtensionAmount>\n';
      
      // Note: TaxTotal par ligne supprimé - non requis par Peppol BIS Billing 3.0
      
      // Article (BG-31)
      ubl += '    <cac:Item>\n';
      ubl += '      <cbc:Name>' + escapeXML(productName) + '</cbc:Name>\n';
      
      if (item.product_barcode) {
        ubl += '      <cac:SellersItemIdentification>\n';
        ubl += '        <cbc:ID>' + escapeXML(item.product_barcode) + '</cbc:ID>\n';
        ubl += '      </cac:SellersItemIdentification>\n';
      }
      
      // ClassifiedTaxCategory - Peppol BIS Billing 3.0 (sans Name)
      ubl += '      <cac:ClassifiedTaxCategory>\n';
      ubl += '        <cbc:ID>' + getVATCategoryCode(itemVatRate) + '</cbc:ID>\n';
      ubl += '        <cbc:Percent>' + itemVatRate.toFixed(2) + '</cbc:Percent>\n';
      ubl += '        <cac:TaxScheme>\n';
      ubl += '          <cbc:ID>VAT</cbc:ID>\n';
      ubl += '        </cac:TaxScheme>\n';
      ubl += '      </cac:ClassifiedTaxCategory>\n';
      
      ubl += '    </cac:Item>\n';
      
      // Prix (BG-29)
      ubl += '    <cac:Price>\n';
      ubl += '      <cbc:PriceAmount currencyID="EUR">' + (parseFloat(item.unit_price) || 0).toFixed(2) + '</cbc:PriceAmount>\n';
      ubl += '    </cac:Price>\n';
      
      ubl += '  </cac:InvoiceLine>\n';
    });
  }
  
  ubl += '</Invoice>';
  return ubl;
}

// Export UBL (Universal Business Language) - Format UBL.BE
export async function exportToUBL(options: ExportOptions): Promise<void> {
  const { documents, companyInfo } = options;
  
  if (documents.length === 1) {
    const ubl = generateUBLContent(documents[0], companyInfo);
    downloadFile(ubl, 'facture_ubl_' + documents[0].sale_number + '_' + format(new Date(), 'yyyy-MM-dd') + '.xml', 'application/xml');
  } else {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    documents.forEach(doc => {
      const ubl = generateUBLContent(doc, companyInfo);
      const filename = 'facture_ubl_' + doc.sale_number.replace(/[^a-zA-Z0-9-_]/g, '_') + '.xml';
      zip.file(filename, ubl);
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'factures_ubl_' + format(new Date(), 'yyyy-MM-dd') + '.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export CSV
export function exportToCSV(options: ExportOptions): void {
  const { documents, type } = options;
  
  let csv = '';
  
  if (type === 'sales') {
    csv = 'Numero;Date;Numero Fiscal;Client;Sous-total HT;TVA;Total TTC;Mode Paiement;Statut\n';
    documents.forEach(doc => {
      csv += '"' + doc.sale_number + '";';
      csv += '"' + format(new Date(doc.date), 'dd/MM/yyyy HH:mm') + '";';
      csv += '"' + (doc.fiscal_number || '') + '";';
      csv += '"' + (doc.customers?.name || '') + '";';
      csv += doc.subtotal.toFixed(2) + ';';
      csv += doc.total_vat.toFixed(2) + ';';
      csv += doc.total.toFixed(2) + ';';
      csv += '"' + (doc.payment_method || '') + '";';
      csv += '"' + (doc.is_cancelled ? 'ANNULE' : 'VALIDE') + '"\n';
    });
  } else {
    csv = 'Numero;Date;Client;N TVA Client;Sous-total HT;TVA;Total TTC;Statut Facture;Statut\n';
    documents.forEach(doc => {
      csv += '"' + doc.sale_number + '";';
      csv += '"' + format(new Date(doc.date), 'dd/MM/yyyy') + '";';
      csv += '"' + (doc.customers?.name || '') + '";';
      csv += '"' + (doc.customers?.vat_number || '') + '";';
      csv += doc.subtotal.toFixed(2) + ';';
      csv += doc.total_vat.toFixed(2) + ';';
      csv += doc.total.toFixed(2) + ';';
      csv += '"' + (doc.invoice_status || 'paye') + '";';
      csv += '"' + (doc.is_cancelled ? 'ANNULE' : 'VALIDE') + '"\n';
    });
  }
  
  downloadFile(csv, type + '_' + format(new Date(), 'yyyy-MM-dd_HHmm') + '.csv', 'text/csv;charset=utf-8;');
}

// Export CSV detaille des produits
export function exportProductsSalesCSV(documents: any[], dateRange?: { start: Date; end: Date }): void {
  const productStats: { [key: string]: { name: string; quantity: number; total: number } } = {};
  
  documents.forEach(doc => {
    if (doc.is_cancelled) return;
    
    doc.sale_items?.forEach((item: any) => {
      const key = item.product_id || item.product_name;
      if (!productStats[key]) {
        productStats[key] = { name: item.product_name, quantity: 0, total: 0 };
      }
      productStats[key].quantity += parseFloat(item.quantity);
      productStats[key].total += parseFloat(item.total);
    });
  });
  
  let csv = 'Produit;Quantite Vendue;Montant Total HT;Montant Total TTC\n';
  
  Object.values(productStats)
    .sort((a, b) => b.total - a.total)
    .forEach(product => {
      csv += '"' + product.name + '";';
      csv += product.quantity.toFixed(3) + ';';
      csv += (product.total / 1.21).toFixed(2) + ';';
      csv += product.total.toFixed(2) + '\n';
    });
  
  csv += '\n';
  csv += 'Total general;' + Object.values(productStats).reduce((sum, p) => sum + p.quantity, 0).toFixed(3) + ';';
  csv += ';' + Object.values(productStats).reduce((sum, p) => sum + p.total, 0).toFixed(2) + '\n';
  
  if (dateRange) {
    csv += '\nPeriode: du ' + format(dateRange.start, 'dd/MM/yyyy') + ' au ' + format(dateRange.end, 'dd/MM/yyyy') + '\n';
  }
  
  downloadFile(csv, 'produits_vendus_' + format(new Date(), 'yyyy-MM-dd_HHmm') + '.csv', 'text/csv;charset=utf-8;');
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

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(['\ufeff' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
