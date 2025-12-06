// Validateur UBL.BE - Vérifie la conformité avant export

export interface UBLValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
}

export interface UBLValidationResult {
  isValid: boolean;
  errors: UBLValidationError[];
  warnings: UBLValidationError[];
}

interface DocumentToValidate {
  sale_number?: string;
  date?: string;
  customers?: {
    name?: string;
    vat_number?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    email?: string;
    phone?: string;
  };
  sale_items?: Array<{
    product_name?: string;
    quantity?: number;
    unit_price?: number;
    vat_rate?: number;
    vat_amount?: number;
    subtotal?: number;
    total?: number;
  }>;
  subtotal?: number;
  total_vat?: number;
  total?: number;
  payment_method?: string;
}

interface CompanyInfo {
  name?: string;
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

export function validateUBLDocument(
  doc: DocumentToValidate,
  companyInfo?: CompanyInfo
): UBLValidationResult {
  const errors: UBLValidationError[] = [];
  const warnings: UBLValidationError[] = [];

  // === VALIDATIONS OBLIGATOIRES (Erreurs) ===

  // BR-01: Numéro de facture obligatoire
  if (!doc.sale_number?.trim()) {
    errors.push({
      code: 'BR-01',
      message: 'Le numéro de facture est obligatoire',
      severity: 'error',
      field: 'sale_number'
    });
  }

  // BR-02: Date de facture obligatoire
  if (!doc.date) {
    errors.push({
      code: 'BR-02',
      message: 'La date de facture est obligatoire',
      severity: 'error',
      field: 'date'
    });
  }

  // BR-04: Nom du vendeur obligatoire
  if (!companyInfo?.name?.trim()) {
    errors.push({
      code: 'BR-04',
      message: 'Le nom de l\'entreprise vendeuse est obligatoire',
      severity: 'error',
      field: 'company.name'
    });
  }

  // BR-06: Numéro TVA vendeur recommandé pour BE
  if (!companyInfo?.vatNumber?.trim()) {
    errors.push({
      code: 'BR-06',
      message: 'Le numéro de TVA du vendeur est obligatoire pour UBL.BE',
      severity: 'error',
      field: 'company.vatNumber'
    });
  } else {
    // Validation format TVA belge
    const vatClean = companyInfo.vatNumber.replace(/\s/g, '').toUpperCase();
    if (!vatClean.match(/^BE[0-9]{10}$/)) {
      warnings.push({
        code: 'BE-VAT',
        message: 'Le numéro de TVA devrait être au format BE0123456789',
        severity: 'warning',
        field: 'company.vatNumber'
      });
    }
  }

  // BR-08: Adresse vendeur
  if (!companyInfo?.address?.trim()) {
    warnings.push({
      code: 'BR-08',
      message: 'L\'adresse du vendeur est recommandée',
      severity: 'warning',
      field: 'company.address'
    });
  }

  // BR-09: Ville vendeur
  if (!companyInfo?.city?.trim()) {
    warnings.push({
      code: 'BR-09',
      message: 'La ville du vendeur est recommandée',
      severity: 'warning',
      field: 'company.city'
    });
  }

  // BR-10: Code postal vendeur
  if (!companyInfo?.postalCode?.trim()) {
    warnings.push({
      code: 'BR-10',
      message: 'Le code postal du vendeur est recommandé',
      severity: 'warning',
      field: 'company.postalCode'
    });
  }

  // BR-25: Chaque ligne doit avoir un nom de produit
  if (doc.sale_items && doc.sale_items.length > 0) {
    doc.sale_items.forEach((item, index) => {
      if (!item.product_name?.trim()) {
        errors.push({
          code: 'BR-25',
          message: `Ligne ${index + 1}: Le nom du produit est obligatoire`,
          severity: 'error',
          field: `sale_items[${index}].product_name`
        });
      }

      // BR-26: Quantité obligatoire
      if (item.quantity === undefined || item.quantity === null) {
        errors.push({
          code: 'BR-26',
          message: `Ligne ${index + 1}: La quantité est obligatoire`,
          severity: 'error',
          field: `sale_items[${index}].quantity`
        });
      }

      // BR-27: Prix unitaire obligatoire
      if (item.unit_price === undefined || item.unit_price === null) {
        errors.push({
          code: 'BR-27',
          message: `Ligne ${index + 1}: Le prix unitaire est obligatoire`,
          severity: 'error',
          field: `sale_items[${index}].unit_price`
        });
      }

      // BR-CO-18: Taux TVA valide
      const vatRate = item.vat_rate ?? 21;
      if (![0, 6, 12, 21].includes(vatRate)) {
        warnings.push({
          code: 'BR-CO-18',
          message: `Ligne ${index + 1}: Taux TVA ${vatRate}% non standard en Belgique (0%, 6%, 12%, 21%)`,
          severity: 'warning',
          field: `sale_items[${index}].vat_rate`
        });
      }
    });
  } else {
    errors.push({
      code: 'BR-16',
      message: 'Au moins une ligne de facture est obligatoire',
      severity: 'error',
      field: 'sale_items'
    });
  }

  // Validation totaux
  if (doc.total === undefined || doc.total === null || doc.total < 0) {
    errors.push({
      code: 'BR-CO-10',
      message: 'Le montant total est obligatoire et doit être positif',
      severity: 'error',
      field: 'total'
    });
  }

  // === VALIDATIONS UBL.BE SPÉCIFIQUES ===

  // ubl-BE-11: Contact vendeur recommandé
  if (!companyInfo?.phone && !companyInfo?.email) {
    warnings.push({
      code: 'ubl-BE-11',
      message: 'Un téléphone ou email du vendeur est recommandé',
      severity: 'warning',
      field: 'company.contact'
    });
  }

  // ubl-BE-12: IBAN recommandé pour paiement
  if (!companyInfo?.iban?.trim()) {
    warnings.push({
      code: 'ubl-BE-12',
      message: 'L\'IBAN est recommandé pour les instructions de paiement',
      severity: 'warning',
      field: 'company.iban'
    });
  } else {
    // Validation format IBAN belge
    const ibanClean = companyInfo.iban.replace(/\s/g, '').toUpperCase();
    if (!ibanClean.match(/^BE[0-9]{14}$/)) {
      warnings.push({
        code: 'BE-IBAN',
        message: 'L\'IBAN devrait être au format belge BE + 14 chiffres',
        severity: 'warning',
        field: 'company.iban'
      });
    }
  }

  // Validation client
  if (doc.customers) {
    if (!doc.customers.name?.trim()) {
      warnings.push({
        code: 'BR-11',
        message: 'Le nom du client est recommandé',
        severity: 'warning',
        field: 'customers.name'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Valide plusieurs documents
export function validateUBLDocuments(
  documents: DocumentToValidate[],
  companyInfo?: CompanyInfo
): { results: Map<string, UBLValidationResult>; totalErrors: number; totalWarnings: number } {
  const results = new Map<string, UBLValidationResult>();
  let totalErrors = 0;
  let totalWarnings = 0;

  documents.forEach((doc, index) => {
    const key = doc.sale_number || `Document ${index + 1}`;
    const result = validateUBLDocument(doc, companyInfo);
    results.set(key, result);
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  });

  return { results, totalErrors, totalWarnings };
}
