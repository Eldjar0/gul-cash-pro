// Utilitaires centralisés pour les modes de paiement.
// Règle caisse : la répartition exacte (payment_split) est la source de vérité.
// Repli sur payment_method uniquement pour les anciennes ventes sans détail.

export interface SalePaymentLike {
  total: number;
  payment_method?: string | null;
  payment_split?: Record<string, number> | null;
}

/** Libellés FR par méthode (source unique). */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  card: 'Carte',
  mobile: 'Mobile',
  check: 'Chèque',
  meal_voucher: 'Chèques-repas',
  voucher: 'Chèques-repas',
  gift_card: 'Carte cadeau',
  customer_credit: 'Crédit client',
  transfer: 'Virement',
  pending: 'En attente',
  unknown: 'Autre',
};

/** Libellés majuscules pour tickets thermiques. */
export const PAYMENT_METHOD_TICKET_LABELS: Record<string, string> = {
  cash: 'ESPECES',
  card: 'CARTE',
  mobile: 'PAIEMENT MOBILE',
  check: 'CHÈQUE',
  meal_voucher: 'CHÈQUES-REPAS',
  voucher: 'CHÈQUES-REPAS',
  gift_card: 'CARTE CADEAU',
  customer_credit: 'CRÉDIT CLIENT',
  transfer: 'VIREMENT',
  pending: 'EN ATTENTE',
  unknown: 'PAIEMENT',
};

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || method;
}

/**
 * Montants réels par méthode pour une vente.
 * - payment_split présent → répartition exacte (ex. { cash: 4.00, card: 1.98 })
 * - sinon → total sur la méthode principale (anciennes ventes)
 */
export function getSalePaymentAmounts(sale: SalePaymentLike): Record<string, number> {
  const split = sale.payment_split;
  if (split && typeof split === 'object' && !Array.isArray(split)) {
    const out: Record<string, number> = {};
    for (const [method, amount] of Object.entries(split)) {
      const amt = Number(amount) || 0;
      if (amt > 0) out[method] = (out[method] || 0) + amt;
    }
    if (Object.keys(out).length > 0) return out;
  }
  const method = sale.payment_method || 'unknown';
  return { [method]: Number(sale.total) || 0 };
}

/** Vrai si la vente comporte plusieurs méthodes. */
export function isMixedPayment(sale: SalePaymentLike): boolean {
  return Object.keys(getSalePaymentAmounts(sale)).length > 1;
}

/** Libellé compact pour exports : "Espèces 4.00€ + Carte 1.98€" ou "Espèces". */
export function formatSalePayments(sale: SalePaymentLike): string {
  const amounts = getSalePaymentAmounts(sale);
  const entries = Object.entries(amounts);
  if (entries.length <= 1) return getPaymentMethodLabel(entries[0]?.[0] || 'unknown');
  return entries
    .map(([m, a]) => `${getPaymentMethodLabel(m)} ${a.toFixed(2)}€`)
    .join(' + ');
}
