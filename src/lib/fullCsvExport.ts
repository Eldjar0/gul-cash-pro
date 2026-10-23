import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';

export const EXPORT_TABLES = [
  'products', 'product_barcodes', 'product_batches', 'categories',
  'customers', 'customer_credit_accounts', 'customer_credit_transactions', 'customer_special_prices',
  'customer_segments', 'customer_segment_members',
  'sales', 'sale_items', 'payment_transactions', 'fiscal_receipts',
  'credit_notes', 'credit_note_items', 'refunds', 'refund_items',
  'quotes', 'quote_items', 'customer_orders', 'customer_order_items', 'mobile_orders',
  'purchase_orders', 'purchase_order_items', 'supplier_receipts', 'supplier_receipt_items',
  'stock_movements', 'inventory_counts', 'inventory_count_items',
  'cash_movements', 'daily_reports', 'gift_cards', 'gift_card_transactions',
  'loyalty_tiers', 'loyalty_transactions', 'promotions', 'marketing_campaigns',
  'label_configurations', 'settings', 'profiles', 'user_roles', 'user_shifts',
] as const;

async function fetchAll(table: string) {
  const rows: any[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await (supabase as any).from(table).select('*').range(from, from + size - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < size) break;
  }
  return rows;
}

function cell(v: any): string {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/[";\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCsv(rows: any[]): string {
  if (!rows.length) return '';
  const cols = Array.from(rows.reduce((set: Set<string>, r) => { Object.keys(r).forEach(k => set.add(k)); return set; }, new Set<string>()));
  const lines = [cols.join(';'), ...rows.map(r => cols.map(c => cell(r[c])).join(';'))];
  return '\uFEFF' + lines.join('\r\n');
}

export async function exportAllAsZip(onProgress?: (table: string, i: number, total: number) => void) {
  const zip = new JSZip();
  const all: Record<string, any[]> = {};
  const summary: string[] = ['table;lignes'];
  for (let i = 0; i < EXPORT_TABLES.length; i++) {
    const t = EXPORT_TABLES[i];
    onProgress?.(t, i + 1, EXPORT_TABLES.length);
    try {
      const rows = await fetchAll(t);
      all[t] = rows;
      zip.file(`csv/${t}.csv`, toCsv(rows));
      summary.push(`${t};${rows.length}`);
    } catch (e: any) {
      summary.push(`${t};erreur: ${e?.message || e}`);
    }
  }
  zip.file('resume.csv', '\uFEFF' + summary.join('\r\n'));
  zip.file('export_complet.json', JSON.stringify({ exported_at: new Date().toISOString(), tables: all }, null, 2));
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export-complet-${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
